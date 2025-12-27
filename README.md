# Build a REST API With Laravel
```
eventy-backend/
├── app/                         # Main application code
│   ├── Http/                    # HTTP layer: controllers, requests, resources
│   │   ├── Controllers/         # Handles incoming requests
│   │   │   ├── Api/             # Versioned API controllers
│   │   │   │   └── V1/          # API v1 endpoints
│   │   │   │       ├── CustomerController.php   # Customer-related API actions
│   │   │   │       └── InvoiceController.php    # Invoice-related API actions
│   │   │   └── Controller.php   # Base controller class
│   │   ├── Requests/            # Form request validation classes
│   │   │   ├── StoreCustomerRequest.php         # Validation for storing a customer
│   │   │   ├── StoreInvoiceRequest.php          # Validation for storing an invoice
│   │   │   ├── UpdateCustomerRequest.php        # Validation for updating a customer
│   │   │   └── UpdateInvoiceRequest.php         # Validation for updating an invoice
│   │   └── Resources/           # API resource transformations
│   │       └── V1/              # Versioned API resources
│   │           ├── CustomerCollection.php      # Collection resource for multiple customers
│   │           ├── CustomerResource.php        # Single customer resource
│   │           ├── InvoiceCollection.php       # Collection resource for multiple invoices
│   │           └── InvoiceResource.php         # Single invoice resource
│   ├── Models/                   #  model classes representing database tables
│   ├── Policies/                 # Authorization logic for models
│   ├── Providers/                # Service providers for bootstrapping services
│   └── Services/                 # Application business logic and query services
│       └── V1/                   # Versioned services
│           └── CustomerQuery.php # Encapsulates customer-related database queries
├── artisan                       # Laravel CLI commands
├── bootstrap/                     # Bootstrap files and cache
├── composer.json                  # PHP dependencies configuration
├── composer.lock                  # Locked dependency versions
├── config/                        # Configuration files for the app
├── database/                      # Database migrations, factories, and seeders
├── package.json                    # Node.js dependencies for frontend tooling
├── phpunit.xml                     # PHPUnit configuration
├── public/                         # Publicly accessible files (index.php, assets)
├── README.md                       # Project overview and instructions
├── resources/                      # Views, language files, frontend assets
├── routes/                         # Application route definitions
├── storage/                        # Logs, cache, file storage
├── tests/                          # Unit and feature tests
├── vendor/                         # Composer-managed dependencies
└── vite.config.js                  # Frontend build tool configuration
```

