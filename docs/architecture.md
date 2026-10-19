# Tài liệu Thiết kế Kiến trúc Hệ thống – BrewLite (v1.0)

> **Mã công việc:** Task A.1 (PB-14) – Sprint 1  
> **Người thực hiện:** M2 (Software Architect / Tech Lead)  
> **Dự án:** BrewLite – Hệ thống đặt cà phê không tiền mặt (Cashless Coffee Ordering System)  
> **Phiên bản:** 1.0.0 (Baseline Architecture)  
> **Hệ quản trị CSDL mục tiêu:** PostgreSQL 16+ (Docker Dev / Neon.tech)  
> **Công nghệ nền tảng:** NestJS (Backend), Next.js App Router (Frontend), Prisma ORM

---

## 1. Tổng quan hệ thống (System Overview & Context)

### 1.1. Bối cảnh nghiệp vụ

BrewLite là giải pháp đặt cà phê trực tuyến tinh gọn dành cho chuỗi cửa hàng F&B, tập trung vào trải nghiệm đặt hàng nhanh, thanh toán không dùng tiền mặt (thẻ ngân hàng, ví điện tử giả lập), cập nhật trạng thái đơn thời gian thực và tích điểm khách hàng thân thiết (Loyalty Points).

### 1.2. Sơ đồ ngữ cảnh hệ thống (C4 Context Diagram)

```mermaid
C4Context
    title Sơ đồ ngữ cảnh hệ thống BrewLite (C4 Context)

    Person(customer, "Khách hàng (Customer)", "Đặt món, tùy chọn size/topping, thanh toán không tiền mặt và theo dõi đơn.")
    Person(barista, "Nhân viên (Barista / Store)", "Tiếp nhận đơn, cập nhật tiến độ pha chế và hoàn thành đơn.")

    System(brewlite, "Hệ thống BrewLite", "Hệ thống quản lý đặt món, thanh toán giả lập và tích lũy điểm thưởng.")

    System_Ext(mockPayment, "Mock Payment Gateway", "Cổng thanh toán giả lập xử lý thẻ/ví với cơ chế Idempotency.")
    SystemDb_Ext(postgres, "PostgreSQL Database", "Lưu trữ quan hệ: Users, Products, Orders, Payments, Loyalty.")

    Rel(customer, brewlite, "Duyệt menu, đặt hàng, thanh toán", "HTTPS / REST API")
    Rel(barista, brewlite, "Theo dõi trạng thái pha chế đơn hàng", "HTTPS / Web App")
    Rel(brewlite, mockPayment, "Ủy quyền & xác nhận thanh toán", "REST / Idempotency-Key")
    Rel(brewlite, postgres, "Đọc/Ghi dữ liệu transactional", "Prisma Client (TCP 5432/5433)")
```

---

## 2. Kiến trúc 3 lớp (3-Tier Architecture Specification)

Hệ thống Backend BrewLite áp dụng kiến trúc **3 lớp (Three-Tier Layered Architecture)** chuẩn hóa trong mô hình **Modular Monolith**, đảm bảo phân tách rõ ràng trách nhiệm (Separation of Concerns - SoC) và dễ dàng kiểm thử độc lập.

```mermaid
graph TD
    subgraph "Tier 1: Presentation Layer (Tầng Giao diện & Tiếp nhận)"
        Client[Next.js Client / Mobile Web]
        Route[NestJS Routing & Dispatcher]
        Pipes[Global ValidationPipe]
        Filters[Global HttpExceptionFilter]
        Guards[AuthGuard / JWT]
        Controller[Controllers: Products, Orders, Payments, Auth]
    end

    subgraph "Tier 2: Business Logic Layer (Tầng Nghiệp vụ)"
        Service[Domain Services: OrderService, PaymentService, ...]
        StateMachine[Order State Machine & Business Rules]
        TxManager[Transaction Orchestration]
    end

    subgraph "Tier 3: Data Access & Persistence Layer (Tầng Truy cập Dữ liệu)"
        PrismaService[Prisma Client / Service Wrapper]
        TxInteractive[Interactive Transactions: $transaction]
        DB[(PostgreSQL 16 Engine)]
    end

    Client -->|HTTP REST + JSON| Route
    Route --> Pipes
    Pipes --> Guards
    Guards --> Controller
    Controller -->|DTO hợp lệ| Service
    Service --> StateMachine
    Service --> TxManager
    TxManager --> PrismaService
    PrismaService --> TxInteractive
    TxInteractive -->|SQL Queries / Connection Pool| DB

    Filters -.->|Bắt ngoại lệ & chuẩn hóa JSON 4xx/5xx| Client
```

### 2.1. Phân định trách nhiệm và ranh giới các tầng

| Tầng kiến trúc                   | Thành phần đảm nhiệm                           | Trách nhiệm chính                                                                                                                                                                                                                            | Ranh giới nghiêm ngặt (Boundaries)                                                                                                        |
| :------------------------------- | :--------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------- |
| **Tier 1: Presentation Layer**   | Controllers, DTOs, Pipes, Guards, Filters      | - Tiếp nhận request HTTP, parse JSON.<br>- Validate định dạng dữ liệu đầu vào qua `ValidationPipe` (`class-validator`).<br>- Xác thực quyền người dùng qua JWT `AuthGuard`.<br>- Chuẩn hóa cấu trúc phản hồi lỗi qua `HttpExceptionFilter`.  | **TUYỆT ĐỐI KHÔNG** query database trực tiếp (không inject `PrismaService`).<br>**TUYỆT ĐỐI KHÔNG** chứa logic tính tiền hoặc chiết khấu. |
| **Tier 2: Business Logic Layer** | Services, Domain Entities, State Machine       | - Thực thi toàn bộ nghiệp vụ lõi: tính tổng tiền đơn hàng từ giá trong DB, kiểm tra tồn kho, áp dụng logic tích điểm 10%.<br>- Điều phối máy trạng thái đơn hàng (State Machine).<br>- Điều phối các thao tác đa bảng thông qua transaction. | Không quan tâm request đến từ HTTP REST, GraphQL hay CLI.<br>Nhận tham số là các DTO/Plain Objects đã qua validate.                       |
| **Tier 3: Data Access Layer**    | `PrismaService`, Prisma Client Model Delegates | - Trừu tượng hóa truy vấn SQL, quản lý kết nối connection pool.<br>- Thực thi atomic transaction (`prisma.$transaction`) để bảo vệ tính nhất quán dữ liệu (ACID).<br>- Chuyển đổi dữ liệu bảng thành TypeScript Type an toàn.                | Không chứa logic nghiệp vụ thanh toán.<br>Chỉ tập trung vào truy xuất, lọc, cập nhật và khóa dữ liệu.                                     |

### 2.2. Chuẩn hóa giao tiếp liên tầng (Cross-Tier Contracts)

- **Dữ liệu vào (Input Contract):** Định nghĩa bằng TypeScript Class kết hợp Decorators (`@IsString()`, `@IsInt()`, `@Min(1)`, `@IsEnum()`). Các thuộc tính lạ bị loại bỏ tự động bằng `whitelist: true, forbidNonWhitelisted: true`.
- **Dữ liệu lỗi (Error Contract):** Thống nhất chuẩn JSON RFC 7807 mở rộng:
  ```json
  {
    "statusCode": 400,
    "message": ["quantity must be greater than 0"],
    "error": "Bad Request",
    "path": "/orders",
    "timestamp": "2026-10-01T12:00:00.000Z"
  }
  ```
- **Quản lý Transaction:** Mọi thao tác ghi liên quan nhiều bảng (ví dụ: Tạo `Order` + Tạo danh sách `OrderItem` + Trừ `stock` của `Product`) bắt buộc phải bọc trong `prisma.$transaction(async (tx) => { ... })`.

---

## 3. Quyết định công nghệ (Architectural Decision Records - ADR)

### ADR-001: Lựa chọn NestJS Modular Monolith cho Backend

- **Bối cảnh:** Dự án cần kiến trúc ổn định, hỗ trợ Dependency Injection (DI) mạnh mẽ, chuẩn hóa code structure cho nhiều thành viên phát triển song song trong môn CNPM.
- **Quyết định:** Sử dụng **NestJS** theo mô hình **Modular Monolith**.
- **Lý do & So sánh:**
  - _So với Express thuần:_ Express quá tự do, thiếu cấu trúc định sẵn dẫn đến tình trạng lộn xộn giữa các tầng logic khi dự án phình to.
  - _So với Microservices:_ Dự án ở giai đoạn MVP, Microservices sẽ gây quá tải hạ tầng (overhead), phức tạp hóa việc deploy và phân tán transaction. Modular Monolith của NestJS gom các domain vào các module độc lập (`ProductsModule`, `OrdersModule`), khi cần tách microservice trong tương lai chỉ cần trích xuất module tương ứng.
- **Hệ quả:** Yêu cầu các thành viên nắm vững Typescript Decorators và luồng Dependency Injection.

### ADR-002: Cơ chế lưu trữ Token xác thực ở Frontend và biện pháp giảm thiểu rủi ro bảo mật

- **Trạng thái:** Accepted (Đã thống nhất trong nhóm)
- **Bối cảnh (Context):**
  - Ứng dụng Next.js (App Router) giao tiếp API NestJS độc lập domain/port qua giao thức REST và định danh JWT Bearer Token.
  - Cần cơ chế lưu trữ `accessToken` sau khi người dùng đăng ký/đăng nhập thành công để tự động gắn kèm Header `Authorization: Bearer <token>` cho các request được bảo vệ (ví dụ: `POST /orders`, `GET /auth/me`).
  - **So sánh 2 phương án lưu trữ:**
    1. _HttpOnly Cookie:_
       - _Ưu điểm:_ Miễn nhiễm hoàn toàn với tấn công XSS do mã JavaScript độc hại phía client không thể đọc được nội dung Cookie.
       - _Nhược điểm:_ Đòi hỏi cấu hình CORS phức tạp (`credentials: true`, `SameSite=None`, `Secure`), gặp trở ngại lớn khi chạy local cross-origin giữa port 3000 (Frontend) và port 3001 (Backend) nếu chưa có HTTPS hoặc custom domain; tiềm ẩn rủi ro tấn công CSRF (Cross-Site Request Forgery) nếu không triển khai thêm CSRF token.
    2. _localStorage (thông qua Zustand Auth Store):_
       - _Ưu điểm:_ Đơn giản, hoàn toàn độc lập domain/port, dễ dàng trích xuất để gắn vào Authorization Header, tương thích hoàn hảo với môi trường phát triển và demo MVP.
       - _Nhược điểm:_ Có nguy cơ bị đánh cắp nếu ứng dụng tồn tại lỗ hổng XSS (Cross-Site Scripting).
- **Quyết định (Decision):**
  - Thống nhất lựa chọn lưu trữ token tại **`localStorage`** (thông qua Zustand Auth Store với middleware persist) cho giai đoạn **MVP Sprint 2**.
  - **Lý do:** Đơn giản hóa tối đa việc giao tiếp cross-origin giữa `localhost:3000` và `localhost:3001`, tăng tốc độ phát triển và đảm bảo tính ổn định khi kiểm thử/demo mà không gặp rào cản chính sách Cookie của trình duyệt.
  - **Biện pháp giảm thiểu rủi ro bảo mật (XSS Mitigation):**
    1. _Thời hạn sống của Token ngắn:_ AccessToken được cấu hình hết hạn sau 1 giờ (`expiresIn: 3600s`), thu hẹp tối đa khoảng thời gian kẻ tấn công có thể lợi dụng nếu token bị rò rỉ.
    2. _Bảo vệ tầng mạng và Header HTTP:_ Backend kích hoạt Helmet để thiết lập Content Security Policy (CSP), X-XSS-Protection và CORS whitelist nghiêm ngặt chỉ cho phép domain Frontend được cấu hình.
    3. _Kiểm soát mã nguồn Frontend:_ Tuyệt đối không sử dụng `dangerouslySetInnerHTML`, không chèn HTML thô từ dữ liệu người dùng nhập vào DOM; React/Next.js mặc định tự động sanitize và escape mọi output.
    4. _Cơ chế tự động hủy Token (Auto-revocation on 401):_ Interceptor ở tầng API Client (`apiFetch`) tự động xóa sạch token khỏi `localStorage` và redirect về trang `/login` ngay khi Backend trả về mã lỗi HTTP 401 Unauthorized, cũng như khi người dùng bấm Đăng xuất.
- **Hướng nâng cấp tương lai (Future Evolution):**
  - Khi triển khai lên hạ tầng Production với domain chính thức (ví dụ: `brewlite.vn` và `api.brewlite.vn`), hệ thống sẽ chuyển dịch sang cơ chế **HttpOnly Cookie** kết hợp cặp đôi **AccessToken (ngắn hạn 15m) + Refresh Token (dài hạn 7d)** và áp dụng kiến trúc **BFF (Backend-for-Frontend)** thông qua Next.js Route Handlers để đạt chuẩn bảo mật cấp doanh nghiệp.

### ADR-003: Lựa chọn PostgreSQL 16 & Prisma ORM

- **Bối cảnh:** Dữ liệu đơn hàng, sản phẩm, thanh toán và tiền tệ đòi hỏi tính toàn vẹn tuyệt đối (ACID), không chấp nhận mất mát hay sai lệch số liệu.
- **Quyết định:** Sử dụng **PostgreSQL 16** quản lý quan hệ và **Prisma ORM** để tương tác dữ liệu.
- **Lý do & So sánh:**
  - _PostgreSQL:_ Hệ quản trị CSDL quan hệ mạnh mẽ, hỗ trợ Indexing cao cấp, ràng buộc Foreign Key chặt chẽ và tương thích các nền tảng Cloud hiện đại (Neon Serverless).
  - _Prisma so với TypeORM/Sequelize:_ Prisma sinh mã TypeScript types tự động 100% đồng bộ với `schema.prisma`, ngăn chặn lỗi runtime sai tên cột hoặc sai kiểu dữ liệu ngay từ lúc code. Prisma migration trực quan, quản lý version schema tin cậy.
- **Hệ quả:** Prisma Interactive Transactions có timeout mặc định (5000ms), cần giữ các thao tác trong transaction ngắn gọn, tối ưu.

### ADR-004: Cơ chế Thanh toán giả lập (Mock Payment) & Idempotency-Key

- **Bối cảnh:** Đặt hàng không tiền mặt dễ gặp sự cố rớt mạng hoặc người dùng ấn nút thanh toán liên tục (Double Click), dẫn đến việc trừ tiền và tạo đơn trùng lặp.
- **Quyết định:** Áp dụng giao thức **Idempotency** dựa trên Header `Idempotency-Key` (chuỗi UUIDv4 sinh ra từ Client cho mỗi phiên thanh toán).
- **Cơ chế:**
  - Bảng `Payment` sử dụng `idempotencyKey` làm Khóa chính (Primary Key).
  - Khi nhận request `POST /payments`, hệ thống kiểm tra `idempotencyKey`:
    - Nếu key đã tồn tại trong DB -> Trả về ngay kết quả giao dịch trước đó (HTTP 200 OK) mà không trừ tiền hay cập nhật lại trạng thái đơn.
    - Nếu key chưa tồn tại -> Khởi tạo thanh toán, cập nhật trạng thái đơn thành `PAID`, lưu bản ghi payment mới trong một transaction duy nhất.
- **Hệ quả:** Client chịu trách nhiệm sinh UUID mới khi muốn thực hiện giao dịch mới và tái sử dụng UUID cũ khi retry giao dịch lỗi mạng.

### ADR-005: Chiến lược Container hóa (Docker Multi-stage) & Môi trường Dev/Prod

- **Bối cảnh:** Cần đảm bảo tính nhất quán môi trường chạy giữa các máy phát triển của thành viên nhóm (Windows/macOS/Linux) và server kiểm thử.
- **Quyết định:**
  - `docker-compose.dev.yml`: Khởi chạy PostgreSQL 16 cục bộ (port `5433:5432`) phục vụ phát triển offline không phụ thuộc internet.
  - `docker-compose.yml`: Đóng gói production đa container gồm Web Frontend, Backend API và PostgreSQL. Dockerfile backend sử dụng multi-stage build để tối ưu dung lượng image và bảo mật.

---

## 4. Thiết kế cấu trúc Module (Module Design)

### 4.1. Cấu trúc thư mục tổng thể Monorepo (npm Workspaces)

```text
BrewLite/
├── backend/                         # Ứng dụng NestJS REST API
│   ├── prisma/
│   │   ├── schema.prisma            # Khai báo cấu trúc dữ liệu & quan hệ
│   │   └── seed.ts                  # Dữ liệu khởi tạo (menu mẫu, tài khoản demo)
│   ├── src/
│   │   ├── common/                  # Tầng dùng chung toàn hệ thống
│   │   │   ├── decorators/          # Custom decorators (@CurrentUser, ...)
│   │   │   ├── filters/             # Global HttpExceptionFilter
│   │   │   ├── guards/              # JwtAuthGuard, RolesGuard
│   │   │   ├── interceptors/        # LoggingInterceptor, TransformInterceptor
│   │   │   └── pipes/               # ParseUUIDPipe, SanitizePipe
│   │   ├── prisma/                  # PrismaModule & PrismaService
│   │   ├── auth/                    # Module xác thực & cấp phát JWT token
│   │   ├── users/                   # Module quản lý người dùng & điểm thưởng
│   │   ├── products/                # Module danh mục cà phê, size, topping, kho
│   │   ├── orders/                  # Module giỏ hàng, đặt hàng, tính toán đơn
│   │   ├── payments/                # Module thanh toán giả lập & Idempotency
│   │   ├── app.module.ts            # Root module kết nối toàn bộ feature modules
│   │   └── main.ts                  # Entry point cấu hình CORS, Pipes, Swagger
│   ├── Dockerfile
│   └── tsconfig.json
├── frontend/                        # Ứng dụng Next.js UI (App Router)
│   ├── src/
│   │   ├── app/                     # Next.js App Router (Layouts, Pages)
│   │   │   ├── (auth)/              # Route group: /login, /register
│   │   │   ├── menu/                # Trang danh sách & chi tiết món
│   │   │   ├── cart/                # Trang giỏ hàng & cấu hình món
│   │   │   ├── checkout/            # Trang xác nhận & thanh toán
│   │   │   ├── orders/              # Lịch sử đơn hàng & tracking trạng thái
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   ├── components/              # UI components tái sử dụng
│   │   │   ├── common/              # Button, Input, Modal, Toast
│   │   │   ├── menu/                # ProductCard, ToppingSelector, SizePicker
│   │   │   └── orders/              # OrderStatusBadge, TimelineTracker
│   │   ├── hooks/                   # Custom React hooks (useCart, useOrderPolling)
│   │   ├── lib/                     # Axios instance, formatting utils, api client
│   │   ├── store/                   # Zustand stores (cartStore, authStore)
│   │   └── types/                   # TypeScript DTOs & Interfaces
│   ├── Dockerfile
│   └── tailwind.config.ts
├── docs/                            # Tài liệu kỹ thuật
│   ├── architecture.md              # [Tài liệu này] Kiến trúc hệ thống v1
│   ├── erd/                         # ERD Diagram, DBML, data schema
│   └── ui/                          # Wireframe, UI flow
├── docker-compose.yml               # Production Compose
├── docker-compose.dev.yml           # Dev Compose (Postgres local)
└── package.json                     # Root workspace configuration
```

### 4.2. Chi tiết các module nghiệp vụ Backend (NestJS)

```mermaid
classDiagram
    class AppModule {
        +PrismaModule
        +AuthModule
        +UsersModule
        +ProductsModule
        +OrdersModule
        +PaymentsModule
    }

    class ProductsModule {
        +ProductsController
        +ProductsService
        +findAll(category)
        +findOne(id)
        +checkStock(items)
    }

    class OrdersModule {
        +OrdersController
        +OrdersService
        +createOrder(userId, createOrderDto)
        +getOrderById(id)
        +getUserOrders(userId)
        +updateStatus(id, newStatus)
    }

    class PaymentsModule {
        +PaymentsController
        +PaymentsService
        +processPayment(idempotencyKey, paymentDto)
        +verifyPayment(paymentId)
    }

    class UsersModule {
        +UsersController
        +UsersService
        +getProfile(id)
        +addLoyaltyPoints(userId, points)
    }

    class AuthModule {
        +AuthController
        +AuthService
        +register(dto)
        +login(dto)
    }

    AppModule --> ProductsModule
    AppModule --> OrdersModule
    AppModule --> PaymentsModule
    AppModule --> UsersModule
    AppModule --> AuthModule
    OrdersModule ..> ProductsModule : "Check tồn kho & Lấy giá"
    PaymentsModule ..> OrdersModule : "Cập nhật trạng thái PAID"
    PaymentsModule ..> UsersModule : "Cộng điểm Loyalty (10%)"
```

---

## 5. Luồng nghiệp vụ cốt lõi & Cross-Cutting Concerns

### 5.1. Luồng Đặt hàng và Thanh toán không tiền mặt (Sequence Diagram)

Sơ đồ thể hiện sự phối hợp chuẩn 3 lớp, đảm bảo Idempotency và bảo vệ tính nhất quán dữ liệu khi thanh toán:

```mermaid
sequenceDiagram
    autonumber
    actor Customer as Khách hàng (Next.js)
    participant Ctrl as Orders / Payments Controller
    participant Service as Domain Services
    participant DB as PostgreSQL (Prisma)
    participant MockPay as Mock Payment Service

    %% Luồng 1: Tạo đơn
    Customer->>Ctrl: POST /orders (Danh sách productId, size, topping, qty)
    Note over Ctrl: ValidationPipe kiểm tra DTO
    Ctrl->>Service: createOrder(userId, items)
    activate Service
    Service->>DB: Query thông tin giá gốc & tồn kho của từng Product
    DB-->>Service: Thông tin sản phẩm hợp lệ
    Note over Service: Tính toán: subtotal, discount, tổng tiền chính xác
    Service->>DB: prisma.$transaction: Tạo Order (PENDING) & OrderItems
    DB-->>Service: Order đã tạo (orderId, status=PENDING, total)
    Service-->>Ctrl: DTO chi tiết Order
    deactivate Service
    Ctrl-->>Customer: HTTP 201 Created (Order metadata)

    %% Luồng 2: Thanh toán Idempotent
    Customer->>Ctrl: POST /payments (Header: Idempotency-Key, Body: orderId, method)
    Ctrl->>Service: processPayment(key, orderId, method)
    activate Service
    Service->>DB: Kiểm tra key trong bảng Payment
    alt Key đã tồn tại (Request gửi lại / Bấm đúp)
        DB-->>Service: Bản ghi Payment cũ
        Service-->>Ctrl: Trả về trạng thái đã thanh toán trước đó (Cache hit)
        Ctrl-->>Customer: HTTP 200 OK (Đã xử lý trước đó)
    else Key mới hoàn toàn
        Service->>MockPay: Thực hiện ủy quyền thanh toán (Ví/Thẻ)
        MockPay-->>Service: Thanh toán thành công (SUCCESS)
        Service->>DB: prisma.$transaction:
        Note over Service,DB: 1. Tạo Payment record với key<br>2. Cập nhật Order.status = PAID<br>3. Trừ stock của Product atomically<br>4. Cộng 10% điểm Loyalty cho User
        DB-->>Service: Commit Transaction thành công
        Service-->>Ctrl: DTO kết quả thanh toán
        deactivate Service
        Ctrl-->>Customer: HTTP 201 Created (Thanh toán hoàn tất)
    end
```

### 5.2. Máy trạng thái đơn hàng (Order State Machine)

Để tránh các lỗi logic chuyển trạng thái tùy tiện, vòng đời của đơn hàng được kiểm soát nghiêm ngặt theo máy trạng thái hữu hạn (FSM):

```mermaid
stateDiagram-v2
    [*] --> PENDING: Khách tạo đơn hàng
    PENDING --> PAID: Thanh toán thành công qua Mock Payment
    PENDING --> PAYMENT_FAILED: Thanh toán thất bại hoặc thẻ bị từ chối
    PENDING --> CANCELLED: Khách hủy đơn trước khi thanh toán

    PAYMENT_FAILED --> PENDING: Thử lại phương thức thanh toán khác
    PAYMENT_FAILED --> CANCELLED: Hủy đơn quá thời gian chờ

    PAID --> PREPARING: Barista xác nhận & bắt đầu pha chế
    PREPARING --> READY: Đồ uống pha xong, mời khách nhận
    READY --> COMPLETED: Khách lấy nước, kết thúc chu trình

    COMPLETED --> [*]
    CANCELLED --> [*]
```

### 5.3. Chiến lược chống Race Condition khi trừ tồn kho

Khi nhiều người đặt cùng một sản phẩm cùng thời điểm:

1. **Kiểm tra mức ứng dụng:** Sử dụng interactive transaction:
   ```typescript
   // Minh họa logic cập nhật tồn kho an toàn trong Service
   await prisma.$transaction(async (tx) => {
     const product = await tx.product.findUnique({ where: { id: item.productId } });
     if (!product || product.stock < item.qty) {
       throw new BadRequestException(
         `Sản phẩm ${product?.name || item.productId} không đủ số lượng tồn kho`,
       );
     }

     // Trừ tồn kho nguyên tử (Atomic Decrement)
     await tx.product.update({
       where: { id: item.productId },
       data: { stock: { decrement: item.qty } },
     });
   });
   ```
2. **Khóa mức CSDL:** Ràng buộc `CHECK (stock >= 0)` trong schema PostgreSQL nhằm đảm bảo tồn kho không bao giờ bị âm ngay cả khi có xung đột luồng xử lý.

### 5.4. Sơ đồ tuần tự Xác thực & Phân quyền (Authentication Sequence Diagrams)

#### 5.4.1. Luồng Đăng nhập & Tạo đơn hàng có xác thực (Login & Authenticated Order Flow)

Chu trình thể hiện quy trình khép kín: Khách hàng đăng nhập -> Nhận JWT AccessToken (hạn 1 giờ) -> Lưu vào `localStorage` qua Zustand Auth Store -> Gửi kèm Header `Authorization: Bearer <token>` khi tạo đơn hàng -> `JwtAuthGuard` giải mã xác thực và chuyển tiếp đến `OrdersController`/`PricingService` để lưu đơn hàng `PENDING`.

```mermaid
sequenceDiagram
    autonumber
    actor Customer as Khách hàng (User)
    participant FE as Frontend (Next.js App)
    participant AuthCtrl as AuthController
    participant Guard as JwtAuthGuard
    participant OrderCtrl as OrdersController
    participant Pricing as PricingService
    participant DB as PostgreSQL (Prisma)

    %% Giai đoạn 1: Đăng nhập
    Note over Customer,AuthCtrl: 1. Đăng nhập & Cấp phát JWT Access Token
    Customer->>FE: Nhập email & mật khẩu, bấm "Đăng nhập"
    FE->>AuthCtrl: POST /auth/login { email, password }
    activate AuthCtrl
    AuthCtrl->>DB: validateUser (So khớp bcrypt hash)
    DB-->>AuthCtrl: Thông tin user hợp lệ
    AuthCtrl-->>FE: HTTP 200 OK { accessToken, expiresIn: 3600, user: { id, email } }
    deactivate AuthCtrl
    FE->>FE: useAuth: Lưu accessToken & user vào Auth Store (localStorage)

    %% Giai đoạn 2: Tạo đơn hàng
    Note over Customer,DB: 2. Tạo đơn hàng với Header Authorization: Bearer <token>
    Customer->>FE: Chọn đồ uống vào giỏ, bấm "Đặt hàng"
    FE->>FE: Lấy accessToken từ localStorage gắn vào Request Header
    FE->>Guard: POST /orders (Header: Authorization: Bearer <token>, Body: { items })
    activate Guard
    Note over Guard: Xác thực chữ ký HS256 & thời hạn hiệu lực
    Guard->>OrderCtrl: Cho phép request đi tiếp (req.user = { id, email })
    deactivate Guard
    activate OrderCtrl
    OrderCtrl->>Pricing: calculateOrderTotal(items)
    activate Pricing
    Pricing->>DB: Lấy giá gốc & phụ thu (Size, Topping)
    DB-->>Pricing: Dữ liệu giá hợp lệ
    Pricing-->>OrderCtrl: Tính toán tổng tiền chính xác
    deactivate Pricing
    OrderCtrl->>DB: prisma.$transaction: Tạo Order (status=PENDING, userId) & OrderItems
    DB-->>OrderCtrl: Bản ghi Order đã tạo thành công
    OrderCtrl-->>FE: HTTP 201 Created { orderId, total, status: "PENDING" }
    deactivate OrderCtrl
    FE-->>Customer: Chuyển hướng đến màn hình xác nhận đơn & thanh toán
```

#### 5.4.2. Luồng Xử lý Token hết hạn / Lỗi 401 Unauthorized (Token Expiration & 401 Interception)

Cơ chế phòng vệ tự động ở tầng Frontend: Khi AccessToken hết hạn sau 1 giờ hoặc không hợp lệ, `JwtAuthGuard` từ chối truy cập với HTTP 401 Unauthorized. Hàm gọi API ở tầng Client (`apiFetch` / interceptor) lập tức bắt lỗi, xóa sạch dữ liệu phiên trong `localStorage` và điều hướng người dùng về trang Đăng nhập kèm tham số `returnUrl`.

```mermaid
sequenceDiagram
    autonumber
    actor Customer as Khách hàng (User)
    participant FE as Frontend (Next.js UI)
    participant Interceptor as API Client (apiFetch / Interceptor)
    participant Guard as Backend (JwtAuthGuard)

    Customer->>FE: Thao tác yêu cầu xác thực (Xem Profile / Đặt món)
    FE->>Interceptor: Gọi apiFetch(endpoint)
    Interceptor->>Guard: Gửi HTTP Request (Header: Authorization: Bearer <token_hết_hạn>)
    activate Guard
    Note over Guard: handleRequest: Phát hiện TokenExpiredError
    Guard-->>Interceptor: HTTP 401 Unauthorized { "statusCode": 401, "message": "Token đã hết hạn" }
    deactivate Guard
    activate Interceptor
    Note over Interceptor: Bắt mã lỗi response.status === 401
    Interceptor->>Interceptor: useAuth.getState().clearAuth()<br/>(Xóa sạch accessToken & user khỏi localStorage / Cookie)
    Interceptor->>FE: Điều hướng window.location.href = /login?returnUrl=/cart
    deactivate Interceptor
    FE-->>Customer: Hiển thị trang Đăng nhập kèm thông báo phiên làm việc hết hạn
```

---

## 6. Kế hoạch xác thực kiến trúc & Tiêu chí hoàn thành (Definition of Done)

- [x] Sơ đồ 3 lớp (Presentation, Business Logic, Data Access) được đặc tả chi tiết kèm sơ đồ tương tác.
- [x] Có đầy đủ các bản ghi quyết định kiến trúc quan trọng (ADR-001 đến ADR-005).
- [x] Cấu trúc module NestJS và Next.js được phân rã rõ ràng theo tính năng.
- [x] Cơ chế thanh toán giả lập với Idempotency Key và máy trạng thái đơn hàng được chuẩn hóa.
- [x] Tài liệu tuân thủ chuẩn Markdown, sơ đồ Mermaid kết xuất rõ ràng, sẵn sàng làm cơ sở triển khai các subtask tiếp theo.
