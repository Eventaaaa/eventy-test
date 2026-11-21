
<img width="1105" height="611" alt="database_schema" src="https://github.com/user-attachments/assets/c6c64396-c6dd-4d63-9e88-29088b76c233" />

# Create the Models
Go to the `eventy-backend` directory and models using
```bash
php artisan make:model User -all
php artisan make:model Venue -all
php artisan make:model VenueService -all
php artisan make:model Media -all
php artisan make:model Price -all
php artisan make:model AvailabilitySlot -all
php artisan make:model Booking -all
php artisan make:model Payment -all
php artisan make:model Review -all
```
P.S: we will create a pivot table migration manually or via the **VenueService** model.
- The `-all` option is equivalent to combining several flags: (m)migration, (c)controller, (r)resources, (f)factory, (s)seeder
- This creates:  `app/Models/`, `database/migrations/`, `app/Http/Controllers/`, `database/factories/`,`database/seeders/`.
- The project now looks as follows

```
app/
 └─ Models/
 └─ Http/
     └─ Controllers/
database/
 ├─ factories/          # Templates for generating fake or test data.
 │  └─ VenueFactory.php
 ├─ migrations/         # Scripts that define and update the database schema (tables, columns, relationships).
 │  └─ xxxx_create_venues_table.php
 └─ seeders/
    └─ VenueSeeder.php   # Scripts to populate the database with initial data.
```
# Create the Database
A database is an organized collection of data that can be easily accessed, managed, and updated.

## Database Migration
Migrations define your tables and columns. Example: Creating a users table with name, email, and password. 

Each of the following migrations represent one step in the evolution of the database.

1.  Go to `database/migrations/xxxx_create_venues_table.php`
2.  Add table fields:
```php  
// for Venues
        Schema::create('venues', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('address');
            $table->timestamps();
        });
// for Venue Services
        Schema::create('venue_services', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // "Catering", "Wedding Stage" etc.
            $table->string('category')->nullable(); // "Food", "Facility", "Tech"
            $table->timestamps();
        });
// for Venue Venue Services
        Schema::create('venue_venue_service', function (Blueprint $table) {
            $table->id();
            $table->foreignId('venue_id')->constrained()->onDelete('cascade');
            $table->foreignId('venue_service_id')->constrained()->onDelete('cascade');
            $table->decimal('price', 10, 2)->nullable(); 
            $table->boolean('is_included')->default(true);
            $table->string('details')->nullable(); // e.g., "Buffet Style" or "500sqft Stage"
            $table->timestamps();
        });
```

3. Update the Models (e.g. Venue.php).
```php
public function services() {
    return $this->belongsToMany(VenueService::class, 'venue_service_venue');
}
public function bookings() { return $this->hasMany(Booking::class); }
public function price() { return $this->hasOne(Price::class); }
public function availabilitySlots() { return $this->hasMany(AvailabilitySlot::class); 
}
```
4. Drops all tables, recreates them from scratch, and then runs your Seeders to fill the DB with data.
```bash
php artisan migrate:fresh --seed
```
- This updates: database/migrations/

## Create factories
Factories are for generating fake data. Example: Automatically create 50 fake users with random names and emails. We pick models that needs fake data (Users and Venues)

```bash
php artisan make:factory UserFactory --model=User
php artisan make:factory VenueFactory --model=Venue
```
- This creates: database/factories/
```php
//************************************* for Users ************************************* //
public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'email_verified_at' => now(),
            'password' => static::$password ??= Hash::make('password'),
            'remember_token' => Str::random(10),
        ];
    }

 public function unverified(): static
    {
        return $this->state(fn (array $attributes) => [
            'email_verified_at' => null,
        ]);
    }

//************************************* for Venues ************************************* //
    public function definition(): array
    {
        return [
            'name' => $this->faker->company() . ' Hall',
            'description' => $this->faker->paragraph(),
            'address' => $this->faker->address(),
        ];
    }
    public function configure()
    {
        return $this->afterCreating(function (\App\Models\Venue $venue) {
            // This ensures every venue always has a price row
            $venue->price()->create([
                'venue_id'    => $venue->id,
                'hourly_rate' => $this->faker->randomFloat(2, 50, 500),
                'amount'      => $this->faker->randomFloat(2, 100, 1000), // Add this line
                'currency'    => 'USD',
            ]);
        });
    }

```
## Create Seeders
Seeders populate your database with initial data. Example: Populate a roles table with predefined roles like admin, editor, user.
- This creates: database/seeders/
1. Update the Classes
```php
//************************************* for Users ************************************* //
    public function run(): void
    {
        User::factory()
            ->count(25)
            ->create();         
    }

//************************************* for Venue ************************************* //
    public function run(): void
    {
        // 1. Get all services created by VenueServiceSeeder
        $services =VenueService::all();

        // 2. Create 10 Venues using the factory
        $venues = Venue::factory(10)->create();

        // 3. Loop through venues to attach random services
        foreach ($venues as $venue) {
            // Pick 2 or 3 random service IDs
            $randomServices = $services->random(rand(2, 3))->pluck('id');
            
            // Attach them to the pivot table
            $venue->venue_services()->attach($randomServices);
        }
    }
```
2. Update the DatabaseSeeder class
```php
    public function run(): void
    {
        // User::factory(10)->create();

        // User::factory()->create([
        //     'name' => 'Test User',
        //     'email' => 'test@example.com',
        // ]);


        $this->call([
        UserSeeder::class,         // 1. Users first
        VenueServiceSeeder::class, // 2. Services second
        VenueSeeder::class,        // 3. Venues third (it will attach services and create prices)
        BookingSeeder::class,      // 4. Bookings last (needs users and venues)
        PaymentSeeder::class,       // 5. Needs bookings
        ]);


    }
```
## Create resources
A Resource is a class that transforms a model (or collection of models) into a structured JSON response for APIs.
```bash
# Transform models into JSON for the API
php artisan make:resource VenueResource
```
- This creates: app/Http/Resources/VenueResource.php


# Verify the results

1. Laravel 11, routes are registered in `bootstrap/app.php`
```php
return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
        api: __DIR__.'/../routes/api.php',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        //
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();

```
2. Create a Temporary Test Route  in `routes/api.php`
```php
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\VenueController;
use App\Http\Controllers\Api\VenueServiceController;
// 1. Authenticated User Route
Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

// 2. Main API Group (No 'v1' prefix)
Route::group(['namespace' => 'App\Http\Controllers\Api'], function () {
    
    // Core Resources
    Route::apiResource('venues', UserController::class);
    Route::apiResource('venues', VenueController::class);
    Route::apiResource('services', VenueServiceController::class);
});

```


## Create Filters