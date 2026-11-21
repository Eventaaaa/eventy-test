Aim: Create CRUD endpoints for venues, users, bookings, reviews, and payments. 

# Step1: Sanctum Environment

## Sanctum Installation 
Sanctum is essential in Laravel because it provides a secure and simple way to add authentication for APIs
1. Prepare the cache table and migrate it to the DataBase
```
php artisan cache:clear
php artisan cache:table
php artisan migrate 
```
2. Publish and Configure Sanctum
```
composer require laravel/sanctum
php artisan vendor:publish --provider="Laravel\Sanctum\SanctumServiceProvider"
php artisan migrate
```
3. Make sure your personal_access_tokens table exists by running `php artisan tinker`. It opens a REPL interactive shell within your Laravel app. This means you can write any PHP code or interact with models and databases directly from the terminal without opening a browser or creating a route.
It is used in the following cases:
- Quickly test code without using a route or controller. 
- Debug and check the database data. 
- Manually create seed data. 
- Verify that the relationships are working correctly.
Now to check that that the personal_access_token table exists in the database or now, use the below command:
```php
>>> \Schema::hasTable('personal_access_tokens'); // should return true
```
## Sanctum integration

1. Register Sanctum Middleware
 Update and replace  `$middlewareGroups['api']` setup in `bootstrap/app.php `structure 
```php
use Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful;
use Illuminate\Routing\Middleware\SubstituteBindings;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
        api: __DIR__.'/../routes/api.php',
    )
    ->withMiddleware(function (Middleware $middleware): void {
    $middleware->appendToGroup('api', [
        EnsureFrontendRequestsAreStateful::class,
        'throttle:api',
        SubstituteBindings::class,
       ]);
     })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
```
2.Protect API Routes
Keep `routes/api.php` as usual. Protect routes with `auth:sanctum:` 
- Why: The old route simply returns the currently authenticated user. It’s useful as a quick test, but it does not integrate with a controller.

```PHP
use App\Http\Controllers\Api\AuthController;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    // Protected CRUD routes will go here
});
```
3. User Model
- No change from older versions
- Auth endpoints: `/register, /login, /logout` are protected using auth:sanctum
- CRUD endpoints: Can now be added under the auth:sanctum middleware group

Now, We have set up Sanctum for API authentication with register/login/logout endpoints, and we are ready to add CRUD routes under the `auth:sanctum` middleware group.

# Step2: 
## CRUD operations
create a complete Laravel 12-ready API route file with Sanctum protection and full CRUD endpoints for your entities: users, venues, services, bookings, reviews, payments.
 1. Go to `routes/api.php`  and add entities to the Middleware
```php

use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\VenueController;
use App\Http\Controllers\Api\VenueServiceController;
use App\Http\Controllers\Api\BookingController;      // NEW: Booking CRUD
use App\Http\Controllers\Api\ReviewController;       // NEW: Review CRUD
use App\Http\Controllers\Api\PaymentController;      // NEW: Payment CRUD


Route::middleware('auth:sanctum')->group(function () {

    // Auth logout
    Route::post('/logout', [AuthController::class, 'logout']);  // existing

    // -------------------------------------------------
    // CRUD endpoints protected by Sanctum
    // -------------------------------------------------

    // Users CRUD (existing)
    Route::apiResource('users', UserController::class);  // already existed

    // Venues CRUD (existing)
    Route::apiResource('venues', VenueController::class); // already existed

    // Venue Services CRUD (existing)
    Route::apiResource('services', VenueServiceController::class); // already existed

    // NEW: Bookings CRUD
    Route::apiResource('bookings', BookingController::class);      // added

    // NEW: Reviews CRUD
    Route::apiResource('reviews', ReviewController::class);        // added

    // NEW: Payments CRUD
    Route::apiResource('payments', PaymentController::class);      // added
});
```
# Step3:
## Swagger documentation
Swagger is for API documentation and testing.
1. Install L5 Swagger
```
composer require "darkaonline/l5-swagger"
```
2. Publish and Configure Swagger
```
php artisan vendor:publish --provider "L5Swagger\L5SwaggerServiceProvider" // This creates the config file: config/l5-swagger.php
```
3. Configure Swagger to Work With Sanctum
* Make sure the 'sanctum' key is inside securitySchemes:
```php
'securitySchemes' => [
    'sanctum' => [
        'type' => 'apiKey',
        'description' => 'Enter token in format (Bearer <token>)',
        'name' => 'Authorization',
        'in' => 'header',
    ],
],
```
* Make sure your `annotations` scan your controllers:
```php
'documentations' => [
    'default' => [
        'paths' => [
            'use_absolute_path' => true,
            'docs_json' => 'api-docs.json',
            'annotations' => [
                base_path('app/Http/Controllers/Api'),
            ],
        ],
    ],
],
```

4. Generate Swagger Documentation
* Create `app/Http/Controllers/Api/OpenApiInfo.php` with this content

* create ready-to-use Swagger docblocks for all your CRUD controllers

Note that : The 4 files (AvailabilitySlotController, PricingRuleController, VenueVenueServiceController, MediaController) are not registered in api.php at all.
* Generate the docs:
```
php artisan l5-swagger:generate
```
5. Test the endpoints — via Swagger UI 
- Run 
```
php artisan serve
```
- then go and check : http://127.0.0.1:8000/api/documentation

# Step 4: DoD Verification Steps
1. Register an Admin user

```
curl -s -X POST http://localhost:8000/api/v1/register \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{"name":"Admin","email":"admin@eventy.com","password":"password123","password_confirmation":"password123","role":"admin"}'
```
<p>✅ Expected: <code>{"token":"...","user":{"role":"admin",...}}</code></p>

2. Login and get a token

```
curl -s -X POST http://localhost:8000/api/v1/login \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{"email":"admin@eventy.com","password":"password123"}'
```
<p>✅ Expected: <code>{"token":"6|vcWMrZv49CTL3eEe5xhW1xJJZ9Y2onxhGJX3xRz0b9105960","user":{"id":564,"name":............}}</code></p>

3. Save the token
```
ADMIN_TOKEN="6|vcWMrZv49CTL3eEe5xhW1xJJZ9Y2onxhGJX3xRz0b9105960"
# Check it
echo $ADMIN_TOKEN
```
<p>✅ Expected: <code>6|vcWMrZv49CTL3eEe5xhW1xJJZ9Y2onxhGJX3xRz0b9105960</code></p>

4. Validate all relations
```
ADMIN_TOKEN="6|vcWMrZv49CTL3eEe5xhW1xJJZ9Y2onxhGJX3xRz0b9105960"

# Bookings with payments + availability slots
curl -s "http://localhost:8000/api/v1/bookings" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Accept: application/json" | python3 -m json.tool | head -40

# Users with bookings + reviews + payments  
curl -s "http://localhost:8000/api/v1/users" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Accept: application/json" | python3 -m json.tool | head -40

# Venues with all relations
curl -s "http://localhost:8000/api/v1/venues" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Accept: application/json" | python3 -m json.tool | head -40
```

5. Check Several Requests
*  User without a token is rejected (401):
```
curl -s http://localhost:8000/api/v1/users \
  -H "Accept: application/json"
```
<p>✅ Expected: <code>{"message":"Unauthenticated."}</code></p>

*  Admin can access user management (200)

```
curl -s http://localhost:8000/api/v1/users \
  -H "Accept: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```
<p>✅ Expected: paginated list of users with status <code>200</code></p>

*  Regular user is blocked from user management (403)
```
curl -s -X POST http://localhost:8000/api/v1/register \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{"name":"Regular User","email":"user@eventy.com","password":"password123","password_confirmation":"password123","role":"user"}'
```
6. Login as regular user and save token
```
USER_TOKEN=$(curl -s -X POST http://localhost:8000/api/v1/login \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{"email":"user@eventy.com","password":"password123"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")
# check it 
echo $USER_TOKEN
9|Cdp2BgmSLNLwJHTo215F5AaHGyYMvyEk43JoRC7O63517ec5
```
7. Try to access users with regular user token:
```
curl -s http://localhost:8000/api/v1/users \
  -H "Accept: application/json" \
  -H "Authorization: Bearer $USER_TOKEN"
```
<p>✅ Expected: <code>{"message":"Forbidden. Admins only."}</code></p>

8. Validate it on Swagger:

a. Go to http://127.0.0.1:8000/api/documentation

b. Click the Authorize 🔒 button at the top right

c. Type the TOKENS 
* For Users: `Bearer 6|vcWMrZv49CTL3eEe5xhW1xJJZ9Y2onxhGJX3xRz0b9105960`

d. Click Authorize then Close

e. Find GET /v1/users, click it → Try it out → Execute

<img width="400" height="400" alt="Screenshot from 2026-03-09 12-20-39" src="https://github.com/user-attachments/assets/a142e392-fb49-4891-9318-1fad64bd65fb" />
