# Tài liệu Thiết kế Kiến trúc Hệ thống – BrewLite (v3.0)

> **Mã công việc:** Sub-task 31.1 (Sprint 3 Architecture Update & Delivery)  
> **Người thực hiện:** M2 (Software Architect / Tech Lead)  
> **Dự án:** BrewLite – Hệ thống đặt cà phê không tiền mặt (Cashless Coffee Ordering System)  
> **Phiên bản:** 3.0.0 (Sprint 3: Advanced Business Logic, Idempotency & Concurrency)  
> **Hệ quản trị CSDL mục tiêu:** PostgreSQL 16+ (Docker Dev / Neon Serverless)  
> **Công nghệ nền tảng:** NestJS 10+ (Backend), Next.js 14+ App Router (Frontend), Prisma ORM 5.19+

---

## 1. Tổng quan hệ thống (System Overview & Context v3)

### 1.1. Bối cảnh nghiệp vụ Sprint 3

Sprint 3 đưa BrewLite từ hệ thống đặt hàng cơ bản lên một nền tảng thương mại F&B hoàn chỉnh, an toàn cao và chịu tải đồng thời:

- **Thanh toán không tiền mặt (Cashless Payments):** Tích hợp Mock Payment Gateway, hỗ trợ thẻ ngân hàng (Card) và ví điện tử (Wallet).
- **Cơ chế Idempotency chống trừ tiền trùng lặp:** Bắt buộc Header `Idempotency-Key` (UUID v4) kết hợp mã băm kiểm tra toàn vẹn payload (`requestHash`), khóa dòng bi quan `SELECT ... FOR UPDATE` khi giao dịch.
- **Cỗ máy trạng thái đơn hàng tập trung (Centralized Order State Machine):** `OrderStatusService` là chốt chặn duy nhất thay đổi trạng thái đơn, kiểm soát nghiêm ngặt 7 trạng thái với ma trận chuyển đổi và kích hoạt các Hook nghiệp vụ tự động (tích điểm khi `PAID`, hoàn kho và hủy điểm khi `CANCELLED`).
- **Khuyến mãi thông minh (Promotions Engine):** Quản lý mã giảm giá theo tỷ lệ phần trăm (`PERCENT`) hoặc số tiền cố định (`FIXED`), kiểm tra điều kiện đơn tối thiểu (`minOrder`), mức giảm trần (`maxDiscount`), thời hạn và giới hạn lượt dùng (`usageLimit`).
- **Kiểm soát tồn kho đồng thời (Optimistic Concurrency Control - OCC):** Sử dụng trường `version` trên bảng `Product` để trừ tồn kho an toàn mà không làm nghẽn kết nối cơ sở dữ liệu.

### 1.2. Sơ đồ ngữ cảnh hệ thống v3 (C4 Context Diagram)

```mermaid
C4Context
    title Sơ đồ ngữ cảnh hệ thống BrewLite v3 (C4 Context)

    Person(customer, "Khách hàng (Customer)", "Đặt đồ uống, áp dụng mã khuyến mãi, thanh toán thẻ/ví, theo dõi tiến độ đơn hàng theo thời gian thực.")
    Person(barista, "Nhân viên pha chế (Barista)", "Theo dõi danh sách đơn hàng đã thanh toán, tiếp nhận pha chế (PREPARING) và hoàn tất (READY).")
    Person(admin, "Quản trị viên (Admin)", "Quản lý danh mục, cài đặt khuyến mãi (Promotion), giám sát tồn kho và đối soát thanh toán.")

    System(brewlite, "Hệ thống BrewLite (v3)", "Xử lý nghiệp vụ F&B: Định giá, Khuyến mãi, Tồn kho đồng thời, State Machine và Giao dịch Idempotent.")

    System_Ext(mockPayment, "Mock Payment Gateway", "Cổng thanh toán giả lập xử lý ủy quyền thẻ/ví với cơ chế Idempotency-Key.")
    SystemDb_Ext(postgres, "PostgreSQL Database", "Lưu trữ quan hệ: Users, Products, Categories, Toppings, Orders, OrderItems, Payments, Promotions.")

    Rel(customer, brewlite, "Tạo đơn, áp mã giảm giá, thanh toán", "HTTPS / REST API")
    Rel(barista, brewlite, "Tiếp nhận đơn, cập nhật trạng thái pha chế", "HTTPS / Web App")
    Rel(admin, brewlite, "Quản trị menu, cấu hình mã ưu đãi, báo cáo", "HTTPS / Admin Portal")
    Rel(brewlite, mockPayment, "Ủy quyền & chốt giao dịch thanh toán", "REST / Idempotency-Key")
    Rel(brewlite, postgres, "Đọc/Ghi dữ liệu transactional ACID (OCC & Lock)", "Prisma Client (TCP 5432)")
```

---

## 2. Kiến trúc phân tầng Modular Monolith (Layered Architecture v3)

Hệ thống Backend BrewLite tiếp tục tuân thủ kiến trúc **3 lớp (Three-Tier Layered Architecture)** chuẩn hóa trong mô hình **Modular Monolith** của NestJS:

```mermaid
graph TD
    subgraph "Tier 1: Presentation Layer (Tầng Giao diện & Tiếp nhận)"
        Client[Next.js Client / Mobile Web]
        Route[NestJS Routing & Dispatcher]
        Pipes[Global ValidationPipe - Whitelist & Transform]
        Filters[Global HttpExceptionFilter - RFC 7807 Format]
        Guards[AuthGuard: JwtAuthGuard / RolesGuard]
        Controllers[Controllers: Auth, Products, Orders, Payments, Promotions]
    end

    subgraph "Tier 2: Business Logic Layer (Tầng Nghiệp vụ)"
        AuthServ[AuthService: bcrypt salt=10, JWT sign/verify]
        ProdServ[ProductsService: catalog, sizes, toppings]
        PriceServ[PricingService: calcUnitPrice, Single Source of Truth]
        OrderServ[OrdersService: tạo đơn, snapshot builder]
        StatusServ[OrderStatusService: FSM 7 trạng thái, SELECT FOR UPDATE, Hooks]
        PayServ[PaymentsService: Idempotency-Key, requestHash, Mock Gateway]
        PromoServ[PromotionsService: validate rules, PERCENT/FIXED calculator]
        StockServ[StockService: Optimistic Concurrency Control via version]
    end

    subgraph "Tier 3: Data Access & Persistence Layer (Tầng Lưu trữ & Dữ liệu)"
        PrismaServ[PrismaService: Connection Pool & Model Delegates]
        TxInteractive[Interactive Transactions: prisma.$transaction]
        DB[(PostgreSQL 16 Engine: Row Lock & OCC)]
    end

    Client -->|HTTP REST + JSON| Route
    Route --> Pipes
    Pipes --> Guards
    Guards --> Controllers

    Controllers -->|DTO đã validate| AuthServ
    Controllers -->|DTO đã validate| ProdServ
    Controllers -->|DTO đã validate| OrderServ
    Controllers -->|DTO đã validate| PayServ
    Controllers -->|DTO đã validate| PromoServ

    OrderServ --> PriceServ
    OrderServ --> PromoServ
    OrderServ --> TxInteractive

    PayServ --> StatusServ
    PayServ --> StockServ
    PayServ --> TxInteractive

    StatusServ -->|Khóa dòng FOR UPDATE & cập nhật status| TxInteractive
    StockServ -->|UPDATE WHERE version = v| TxInteractive

    TxInteractive --> PrismaServ
    PrismaServ --> DB
    Filters -.->|Chuẩn hóa JSON Error 4xx/5xx| Client
```

---

## 3. Đặc tả 8 Module nghiệp vụ cốt lõi Backend (NestJS Modules v3)

Trong Sprint 3, hệ thống được module hóa thành **8 module chuyên trách**:

### 3.1. `ProductsModule`: Danh mục & Thông tin sản phẩm

- **Nhiệm vụ:** Quản lý danh mục (`Category`), sản phẩm (`Product`), cấu hình kích cỡ (`ProductSize`) và danh sách topping khả dụng (`ProductTopping`).
- **Đặc điểm v3:** Bổ sung trường `version Int` phục vụ kiểm soát tồn kho đồng thời.

### 3.2. `AuthModule`: Xác thực & Phân quyền RBAC

- **Nhiệm vụ:** Đăng ký, đăng nhập JWT stateless (HS256, hạn 1 giờ), băm mật khẩu `bcrypt` (salt = 10 rounds).
- **Đặc điểm v3:** Hỗ trợ 3 vai trò người dùng trong hệ thống: `CUSTOMER`, `BARISTA`, `ADMIN`.

### 3.3. `PricingModule`: Đơn vị tính giá duy nhất (Single Source of Truth)

- **Nhiệm vụ:** Tính toán đơn giá từng ly (`calcUnitPrice`), phụ thu size và tổng giá trị dòng món.
- **Nguyên tắc:** Zero Client Trust – máy chủ tự truy vấn giá gốc từ CSDL và bỏ qua mọi thông số giá client gửi lên.

### 3.4. `OrdersModule`: Khởi tạo & Truy vấn đơn hàng

- **Nhiệm vụ:** Tiếp nhận giỏ hàng, gọi `PricingService` tạo snapshot kế toán bất biến (`OrderItem`, `OrderItemTopping`), lưu đơn ở trạng thái ban đầu `PENDING`.
- **Endpoints:** `POST /orders`, `GET /orders/me`, `GET /orders/:id`.

### 3.5. `OrderStatusModule` (`OrderStatusService`): Cỗ máy trạng thái tập trung (MỚI)

- **Nhiệm vụ:** **Nơi duy nhất được phép cập nhật `Order.status`** trên toàn hệ thống.
- **Cơ chế an toàn:** Khóa dòng bi quan (`SELECT ... FOR UPDATE`) bên trong transaction để loại bỏ race condition khi nhiều sự kiện đồng thời tác động lên một đơn.
- **Ma trận trạng thái:** Kiểm tra cặp chuyển đổi qua `assertTransition(from, to)`. Nếu vi phạm ném `409 Conflict` (`INVALID_TRANSITION`).
- **Hook điều phối:**
  - `onPaid`: Kích hoạt cộng điểm thưởng thành viên (Loyalty).
  - `onCancelled`: Kích hoạt hoàn trả tồn kho và thu hồi điểm thưởng.

### 3.6. `PaymentsModule`: Thanh toán Idempotent & Mock Gateway (MỚI)

- **Nhiệm vụ:** Xử lý thanh toán không tiền mặt cho đơn hàng qua phương thức thẻ (`CARD`) hoặc ví (`WALLET`).
- **Bảo mật Idempotency:** Bắt buộc Header `Idempotency-Key` (UUID v4).
- **Kiểm tra toàn vẹn:** Sinh `requestHash = sha256(orderId|method|cardLast4)`.
  - Khóa trùng + hash trùng $\rightarrow$ Trả kết quả đã cache (200 OK).
  - Khóa trùng + hash lệch $\rightarrow$ Trả `422 Unprocessable Entity` (phát hiện giả mạo).
  - Khóa mới $\rightarrow$ Xử lý thanh toán qua Mock Gateway, gọi `OrderStatusService.transition(..., PAID)`.

### 3.7. `PromotionsModule`: Động cơ khuyến mãi & Giảm giá (MỚI)

- **Nhiệm vụ:** Xác thực và áp dụng mã voucher ưu đãi cho đơn hàng.
- **Hỗ trợ 2 kiểu chiết khấu:**
  - `PERCENT`: Giảm theo tỷ lệ % (ví dụ 10%), có chặn mức giảm tối đa `maxDiscount`.
  - `FIXED`: Giảm số tiền cố định (ví dụ 15.000 VND).
- **Quy tắc kiểm duyệt:** Kiểm tra ngày hiệu lực (`startsAt <= now <= endsAt`), trạng thái kích hoạt (`isActive`), giá trị đơn tối thiểu (`minOrder`), và giới hạn lượt dùng (`usedCount < usageLimit`). Tăng `usedCount` nguyên tử khi đơn thanh toán thành công.

### 3.8. `StockModule`: Quản lý tồn kho bằng Optimistic Concurrency Control (MỚI)

- **Nhiệm vụ:** Kiểm soát số lượng đồ uống khả dụng, ngăn chặn hiện tượng bán âm kho (overselling) trong các khung giờ cao điểm.
- **Cơ chế:** Dùng Optimistic Locking với trường `Product.version`. Thực hiện trừ kho không cần khóa đọc, chỉ khóa điều kiện khi ghi `UPDATE ... WHERE id = ... AND version = ... AND stock >= qty`.

---

## 4. Mô hình Dữ liệu Bổ sung ERD v3 (Database Schema v3)

### 4.1. Sơ đồ thực thể quan hệ ERD v3 (Mermaid)

```mermaid
erDiagram
    User ||--o{ Order : "đặt hàng (1-N)"
    Order ||--|{ OrderItem : "chứa chi tiết (1-N)"
    Product ||--o{ OrderItem : "tham chiếu gốc (1-N)"
    OrderItem ||--o{ OrderItemTopping : "kèm topping (1-N)"
    Topping ||--o{ OrderItemTopping : "tham chiếu gốc (1-N)"
    Category ||--o{ Product : "phân loại (1-N)"
    Product ||--o{ ProductSize : "cấu hình size (1-N)"
    Product ||--o{ ProductTopping : "cho phép topping (1-N)"
    Order ||--o{ Payment : "giao dịch thanh toán (1-N)"

    User {
        int id PK "autoincrement"
        string email UK "Email đăng nhập"
        string passwordHash "Băm bcrypt salt=10"
        Role role "Enum: CUSTOMER, BARISTA, ADMIN"
        int loyaltyPoints "Điểm thưởng thành viên"
        datetime createdAt "Ngày tạo tài khoản"
    }

    Product {
        int id PK "autoincrement"
        int categoryId FK "Thuộc danh mục"
        string name UK "Tên sản phẩm"
        int price "Giá gốc size S"
        int stock "Số lượng tồn kho"
        int version "Optimistic Locking version"
        boolean isActive "Trạng thái kinh doanh"
    }

    Order {
        int id PK "autoincrement"
        int userId FK "Khách hàng đặt"
        OrderStatus status "Enum: 7 trạng thái"
        int total "Tổng tiền thực thanh toán (VND)"
        int subtotal "Tạm tính trước giảm giá (VND)"
        int discount "Số tiền chiết khấu (VND)"
        string promoCode "Mã khuyến mãi đã áp dụng"
        int pointsEarned "Điểm tích lũy khi PAID"
        string idempotencyKey "Khóa chống trùng tạo đơn"
        datetime createdAt "Thời gian tạo đơn"
        datetime updatedAt "Thời gian cập nhật"
    }

    OrderItem {
        int id PK "autoincrement"
        int orderId FK "Thuộc đơn hàng"
        int productId FK "Sản phẩm gốc"
        Size size "Enum: S, M, L"
        int qty "Số lượng ly"
        int unitPrice "Snapshot đơn giá 1 ly"
        int lineTotal "Snapshot thành tiền dòng món"
    }

    OrderItemTopping {
        int orderItemId PK,FK "Thuộc dòng OrderItem"
        int toppingId PK,FK "Topping gốc"
        int price "Snapshot giá topping lúc mua"
    }

    Promotion {
        int id PK "autoincrement"
        string code UK "Mã khuyến mãi (in hoa)"
        DiscountType type "Enum: PERCENT, FIXED"
        int value "Giá trị % hoặc số tiền VND"
        int minOrder "Giá trị đơn tối thiểu"
        int maxDiscount "Mức giảm trần (cho PERCENT)"
        datetime startsAt "Thời điểm bắt đầu"
        datetime endsAt "Thời điểm kết thúc"
        int usageLimit "Giới hạn lượt sử dụng"
        int usedCount "Số lượt đã dùng"
        boolean isActive "Trạng thái hoạt động"
    }

    Payment {
        string idempotencyKey PK "UUID v4 chống trùng lặp"
        int orderId FK "Đơn hàng thanh toán"
        int amount "Số tiền giao dịch (VND)"
        string method "Phương thức: CARD | WALLET"
        PaymentStatus status "Enum: SUCCEEDED, FAILED, REFUNDED"
        string requestHash "sha256(orderId|method|cardLast4)"
        string cardLast4 "4 số cuối thẻ (nếu là CARD)"
        string failureReason "Lý do thất bại nếu có"
        datetime createdAt "Thời gian thực hiện"
    }
```

### 4.2. Danh mục Enum mới trong Sprint 3

```typescript
// Trạng thái giao dịch thanh toán
export enum PaymentStatus {
  SUCCEEDED = 'SUCCEEDED', // Thanh toán thành công
  FAILED = 'FAILED', // Giao dịch bị từ chối / lỗi số dư
  REFUNDED = 'REFUNDED', // Đã hoàn tiền về tài khoản
}

// Kiểu chiết khấu của chương trình khuyến mãi
export enum DiscountType {
  PERCENT = 'PERCENT', // Giảm theo % giá trị đơn
  FIXED = 'FIXED', // Giảm trừ số tiền trực tiếp (VND)
}

// Vòng đời đơn hàng 7 trạng thái chuẩn hóa
export enum OrderStatus {
  PENDING = 'PENDING', // Đơn vừa tạo, chờ thanh toán
  PAID = 'PAID', // Đã thanh toán thành công
  PAYMENT_FAILED = 'PAYMENT_FAILED', // Thanh toán thất bại, chờ thử lại
  PREPARING = 'PREPARING', // Barista đang pha chế
  READY = 'READY', // Sẵn sàng tại quầy, chờ khách lấy
  COMPLETED = 'COMPLETED', // Khách đã nhận món (hoàn tất)
  CANCELLED = 'CANCELLED', // Đơn đã hủy
}
```

---

## 5. Nguyên tắc Thiết kế, Bảo mật & Đồng thời cốt lõi

### 5.1. Cơ chế Idempotency & Bảo mật thanh toán chuyên sâu

Nhằm ngăn chặn hiện tượng trừ tiền hai lần và phát hiện kịp thời các nỗ lực tấn công đổi payload, quy trình thanh toán áp dụng cơ chế 4 bước nghiêm ngặt:

```mermaid
sequenceDiagram
    autonumber
    actor Client as Next.js Client
    participant Ctrl as PaymentsController
    participant Serv as PaymentsService
    participant StatusServ as OrderStatusService
    participant DB as PostgreSQL (Prisma tx)
    participant Gateway as Mock Payment Gateway

    Client->>Ctrl: POST /payments<br>Header: Idempotency-Key: <UUID><br>Body: { orderId, method, cardLast4 }
    Ctrl->>Serv: processPayment(key, dto)
    activate Serv

    Serv->>Serv: Tính requestHash = sha256(orderId|method|cardLast4)
    Serv->>DB: prisma.payment.findUnique({ where: { idempotencyKey: key } })

    alt Khóa Idempotency-Key ĐÃ TỒN TẠI
        DB-->>Serv: Trả về bản ghi Payment cũ
        alt requestHash KHỚP
            Note over Serv,Client: Khách bấm lặp hoặc mạng chập chờn gửi lại
            Serv-->>Ctrl: Trả kết quả thanh toán cũ (200 OK / Cached)
            Ctrl-->>Client: HTTP 200 OK (Kết quả giao dịch trước đó)
        else requestHash KHÔNG KHỚP
            Note over Serv,Client: Cảnh báo giả mạo / tái sử dụng sai key
            Serv-->>Ctrl: Ném ngoại lệ 422 Unprocessable Entity
            Ctrl-->>Client: HTTP 422: "Idempotency-Key đã dùng cho giao dịch khác"
        end
    else Khóa CHƯA TỒN TẠI (Giao dịch mới)
        Serv->>DB: Bắt đầu Transaction (prisma.$transaction)
        activate DB
        Serv->>StatusServ: transition(tx, orderId, PAID)
        activate StatusServ
        StatusServ->>DB: SELECT id, status FROM "Order" WHERE id = :id FOR UPDATE
        Note over StatusServ,DB: Khóa dòng ngăn chặn race condition!
        StatusServ->>StatusServ: assertTransition(order.status, PAID)
        StatusServ-->>Serv: Chuyển trạng thái Order hợp lệ
        deactivate StatusServ

        Serv->>Gateway: authorizeAndCharge({ amount, method, cardLast4 })
        Gateway-->>Serv: Kết quả: SUCCESS / FAILED

        Serv->>DB: tx.payment.create({ idempotencyKey, orderId, amount, status, requestHash })
        Serv->>DB: Commit Transaction
        deactivate DB

        Serv-->>Ctrl: Kết quả giao dịch thanh toán mới
        deactivate Serv
        Ctrl-->>Client: HTTP 201 Created (Payment details)
    end
```

### 5.2. Kiểm soát tồn kho đồng thời với Optimistic Concurrency Control (OCC)

Thay vì dùng `SELECT ... FOR UPDATE` làm nghẽn toàn bộ luồng duyệt menu của khách hàng, bảng `Product` áp dụng Optimistic Locking:

1. Đọc dữ liệu tự do không khóa:
   ```typescript
   const product = await prisma.product.findUnique({ where: { id: productId } });
   ```
2. Thực thi câu lệnh cập nhật có điều kiện kiểm tra phiên bản:
   ```sql
   UPDATE "Product"
   SET "stock" = "stock" - :qty,
       "version" = "version" + 1
   WHERE "id" = :productId
     AND "version" = :currentVersion
     AND "stock" >= :qty;
   ```
3. Nếu số dòng cập nhật thành công (`affectedRows === 1`), việc trừ tồn kho hoàn tất an toàn. Nếu `affectedRows === 0`, hệ thống nhận diện đã có tiến trình khác can thiệp đồng thời hoặc món đã hết hàng, từ đó tiến hành retry tự động với backoff trước khi phản hồi lỗi `409 Conflict`.

---

## 6. Luồng nghiệp vụ cốt lõi & Cỗ máy trạng thái đơn hàng (FSM v3)

### 6.1. Sơ đồ State Machine 7 trạng thái (Mermaid)

```mermaid
stateDiagram-v2
    [*] --> PENDING: Khách tạo đơn hàng (POST /orders)

    PENDING --> PAID: Thanh toán thành công (POST /payments)
    PENDING --> PAYMENT_FAILED: Cổng thanh toán báo lỗi / Thẻ từ chối
    PENDING --> CANCELLED: Khách bấm hủy đơn trước khi thanh toán

    PAYMENT_FAILED --> PAID: Thử lại thanh toán thành công
    PAYMENT_FAILED --> PAYMENT_FAILED: Thử lại thanh toán tiếp tục thất bại
    PAYMENT_FAILED --> CANCELLED: Hết hạn chờ thanh toán / Khách hủy đơn

    PAID --> PREPARING: Barista tiếp nhận & bắt đầu chế biến
    PAID --> CANCELLED: Quán hủy đơn (sự cố hết nguyên liệu)

    PREPARING --> READY: Hoàn tất pha chế, đặt tại quầy nhận món

    READY --> COMPLETED: Khách hàng xuất trình mã và nhận nước

    COMPLETED --> [*]
    CANCELLED --> [*]
```

### 6.2. Ma trận 49 cặp chuyển đổi trạng thái & Tác vụ Hooks đi kèm

Cỗ máy trạng thái tuân thủ ma trận kiểm tra nghiêm ngặt $7 \times 7 = 49$ cặp trạng thái:

| Trạng thái nguồn (`from`) | Trạng thái đích hợp lệ (`to`)         | Tác nhân kích hoạt           | Tác vụ kích hoạt đi kèm (Lifecycle Hooks)                                                                                           |
| :------------------------ | :------------------------------------ | :--------------------------- | :---------------------------------------------------------------------------------------------------------------------------------- |
| **`PENDING`**             | `PAID`, `PAYMENT_FAILED`, `CANCELLED` | Khách hàng / Cổng thanh toán | • Vào `PAID`: Kích hoạt Hook tích điểm thưởng thành viên (`LoyaltyService`).<br>• Vào `CANCELLED`: Không cần hoàn điểm (chưa tích). |
| **`PAYMENT_FAILED`**      | `PAID`, `PAYMENT_FAILED`, `CANCELLED` | Khách hàng / Cổng thanh toán | • Vào `PAID`: Kích hoạt Hook tích điểm thưởng thành viên.<br>• `PAYMENT_FAILED`: Ghi nhận lý do thất bại.                           |
| **`PAID`**                | `PREPARING`, `CANCELLED`              | Barista / Quản lý cửa hàng   | • Vào `CANCELLED`: Kích hoạt Hook hoàn trả tồn kho (`StockService`) và thu hồi điểm loyalty đã tích.                                |
| **`PREPARING`**           | `READY`                               | Barista quầy pha chế         | Đổi cờ trạng thái, gửi thông báo đồ uống sẵn sàng.                                                                                  |
| **`READY`**               | `COMPLETED`                           | Khách hàng / Nhân viên quầy  | Đóng đơn hàng, hoàn tất chu trình phục vụ.                                                                                          |
| **`COMPLETED`**           | _(Không có - Trạng thái kết thúc)_    | —                            | Cấm mọi hành vi chuyển trạng thái tiếp theo (Ném `409 INVALID_TRANSITION`).                                                         |
| **`CANCELLED`**           | _(Không có - Trạng thái kết thúc)_    | —                            | Cấm mọi hành vi phục hồi hoặc đổi sang trạng thái khác.                                                                             |

> [!IMPORTANT]
> Toàn bộ 42 cặp trạng thái còn lại (như `PENDING` $\rightarrow$ `READY`, `COMPLETED` $\rightarrow$ `PREPARING`, `READY` $\rightarrow$ `PREPARING`, `CANCELLED` $\rightarrow$ `PAID`...) đều bị cấm tuyệt đối và được bảo vệ bởi bộ Unit Test ma trận 49 cặp (`order-state-machine.spec.ts`).

---

## 7. Danh mục Quyết định Kiến trúc (ADR Index)

| Mã ADR      | Tiêu đề quyết định                                                                                                                                                              | Trạng thái   | Ngày duyệt     | Phạm vi                     |
| :---------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | :----------- | :------------- | :-------------------------- |
| **ADR-001** | Lựa chọn kiến trúc Modular Monolith trên nền tảng NestJS & Next.js App Router                                                                                                   | Accepted     | 2026-10-15     | Toàn hệ thống               |
| **ADR-002** | Lựa chọn PostgreSQL và Prisma ORM làm nền tảng CSDL quan hệ chính thức                                                                                                          | Accepted     | 2026-10-16     | Database & Persistence      |
| **ADR-003** | [Quản lý trạng thái đơn hàng tập trung, Chống thanh toán lặp bằng Idempotency Key và Khóa lạc quan tồn kho](file:///docs/architecture/adr/003-state-machine-and-idempotency.md) | **Accepted** | **2026-10-31** | **Backend Core (Sprint 3)** |
| **ADR-006** | Server-side Pricing as Single Source of Truth & Snapshot Pattern kế toán                                                                                                        | Accepted     | 2026-10-24     | Định giá & Đơn hàng         |
| **ADR-007** | Xác thực phi trạng thái (Stateless Authentication) bằng JWT, Passport & Bcrypt                                                                                                  | Accepted     | 2026-10-24     | Bảo mật & Xác thực          |

---

## 8. Tiêu chí hoàn thành (Definition of Done - DoD v3.0)

- [x] Kiến trúc phân hệ Backend Sprint 3 (`Payments`, `Promotions`, `Stock`, `OrderStatus`) được mô tả chi tiết, rõ ràng ranh giới.
- [x] Sơ đồ tuần tự Sequence Diagram xử lý Idempotency Key, Request Hash và khóa dòng `SELECT ... FOR UPDATE` được tích hợp.
- [x] Sơ đồ State Machine 7 trạng thái và bảng ma trận chuyển đổi kèm các Hook kích hoạt nghiệp vụ (`PAID` tích điểm, `CANCELLED` hoàn kho) được chuẩn hóa.
- [x] Cơ chế Optimistic Concurrency Control (`Product.version`) được mô hình hóa và phân tích rủi ro/đánh đổi rõ ràng.
- [x] Bản ghi quyết định kiến trúc ADR-003 (`docs/architecture/adr/003-state-machine-and-idempotency.md`) được tạo lập chuẩn định dạng.
- [x] Tài liệu markdown chuẩn, cú pháp Mermaid hợp lệ 100%, sẵn sàng cho nghiệm thu Sub-task 31.1.
