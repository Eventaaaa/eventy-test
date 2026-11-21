Filtering is needed because it allows systems and APIs to return only relevant data, which improves performance, scalability, usability, security, and maintainability. Without filtering, an API would return all records, even when the client only needs a small subset (Check: [00:35:48](https://www.youtube.com/watch?v=YGqCZjdgJJk&t=2148s) to [00:49:47](https://www.youtube.com/watch?v=YGqCZjdgJJk&t=2987s)). 
-  All based on  [ Build a REST API With Laravel](https://www.youtube.com/watch?v=YGqCZjdgJJk) 
- Filtering is supported only for **GET** requests that return collections (e.g. _customers_, _invoices_).
- The filtering logic is reusable and centralized in a service class to avoid duplication as the API grows.
<img width="960" height="540" alt="filter_data" src="https://github.com/user-attachments/assets/ba8ee41e-5124-40c4-8100-66730d6ea57e" />

## Customers Filters
- Fist rule of handling user input (query string )is "DONT TRUST".
- Query-string syntax follows this pattern: `customers?postalCode[gt]=30000` and We  need to make sure that, whatever is in the filter `customers?postalCode[gt]=30000` is what we support.
- Laravel automatically converts query strings like postalCode[gt]=30000 into arrays—no manual parsing is required.

1. Create the customer query class: `app/Services/V1/CustomerQuery.php` (`app/Services/V1` is the versioned service directory) 
2. Modify the **CustomerQuery.php**
```php
// Use Access to the request
use illminate\Http\Request;

class CustomerQuery
{
    // set the allowed filters and operators
    protected $allowedParams = [
        'name' => ["eq"],
        'type' => ["eq"],
        'email' => ["eq"],  
        'address' => ["eq"],
        'city' => ["eq"],
        'state' => ["eq"],
        'posalcode' => ["eq", "gt", "lt"],
    ];
   // Map the field  -->  database columns
   protected $columnMap = [
        'name' => 'name',
        'type' => 'type',
        'email' => 'email',
        'address' => 'address',
        'city' => 'city',
        'state' => 'state',
        'postalcode' => 'postal_code',
    ];
   // Map the query Operators  -->  eloquent Operators
    protected $operatorMap = [
        "eq" => "=",
        "lt" => "<",
        "lte" => "<=",
        "gt" => ">",
        "gte" => ">=",
    ];
    // Function transorm the request query --> array passed to the eloquent
    public function transform(Request $request){
         $eloQuery = [];
         //iterate over safe params and set of allpwed operators
         foreach ($this->safeParms as $parm => $operators){
            // get value from query string
            $query =$request->query($parm);
            // if value doesnt exists for param
            if (!isset($query)){
                continue;
            }
            // get the column name for that query param
            $column = $this->columnMap[$parm] ?? $parm;
            // iterate over allowed operators for param
            foreach ($operators as $operator){
                // check if operator value exists in query string
                if(isset($query[$operator])){
                    $eloQuery[] = [
                        $column,
                        $this->operatorMap[$operator],
                        $query[$operator]
                    ];
                }
            }
        }
         return $eloQuery;
    }

}
```
3. Modify the `public function index(Request $request)` inside the class  **CustomerController.php**
```php
    public function index(Request $request)
    {
        $filter = new CustomersFilter();
        // queryItems will be an array of arrays [['column', 'operator', 'value']]
        // value is the the value to filter by: (e.g. Postal Code = 12345)
        $queryItems = $filter->transform($request); 
        if (count($queryItems) == 0) {
            // no filters applied, return all customers paginated
            return new CustomerCollection(Customer::paginate());
        }
        else {
            // this will fix the issue of losing query parameters in pagination links
            $customer = Customer::where($queryItems)->paginate();
            return new CustomerCollection($customer->appends($request->query()));
        }
    }
```
4. Modify the  name space inside the class **CustomerController.php** 
```bash
// Use Access to the request
use Illuminate\Http\Request; 
use App\Services\V1\CustomerQuery;
```
5. Verify the results:
- Check all the customers  http://localhost:8080/api/v1/customers?postalCode[gt]=88864&type[eq]=i

> P.S: The query string in the URL is implicitly an "**AND**" Query , means that you cannot do "**OR**".

## Invoices Filter
It makes sense to include the invoices, whenever we request our customers but not for every request (the client or the user need to specify when they want that information)
### Class generalization
1.Rename the __Services__ folder to __Filters__ o keep all the Filters in one place
2. Modify the name spaces inside the class  **CustomerQuery.php**
```php
namespace App\Filters\V1;
```
2. Change the the class  **CustomerQuery** into **CustomersFilter** and so the file name 
3. create a file `Filters/ApiFilter.php`
4. copy the content of the **CustomersFilter.php**  into **ApiFilter.php** with some modifications
```php
<?php
namespace App\Filters;
use Illuminate\Http\Request;

class ApiFilter
{
    protected $safeParms = [];
    protected $columnMap = [];
    protected $operatorMap = [];
    ----------------------------------------------------------------
```
5. Extend  **CustomersFilter** to the api filter 
```php
use  App\Filters\ApiFilter;

class CustomersFilter extends ApiFilter
```
6. Modify the name spaces inside the class  **CustomersController.php**
```php
use App\Filters\V1\CustomersFilter; // instead of use App\Services\V1\CustomerQuery;
$filter = new CustomersFilter(); // instead of $filter = new CustomerQuery();
```
7. Remove the `public function transform` completely, since it is now part of the **ApiFilter.php**


### Define Invoices Filter
1. Create the invoice query class: `app/Filters/V1/InvoicesFilter.php` (`app/Filters/V1` is the versioned service directory) 
-  You can copy from the file **CustomersFilter.php** and dont forget to modify the class name inside  **InvoicesFilter.php**
2. Modify the **InvoicesFilter.php**
- Map the tables listed in the `/eventy-backend/database/migrations/2025_12_24_162159_create_invoices_table.php` in the **InvoicesFilter.php** 
```php
<?php
namespace App\Filters\V1;
use Illuminate\Http\Request;
use  App\Filters\ApiFilter;

class InvoicesFilter extends ApiFilter
{

    protected $safeParms = [
        'customerId' => ["eq"],
        'amount' => ["eq", "gt", "lt", "gte", "lte"],
        'status' => ["eq",  "neq"],  // neq = for invoices whch are not paid
        'billedDate' => ["eq", "gt", "lt", "gte", "lte"],
        'paidDate' => ["eq", "gt", "lt", "gte", "lte"],
    ];

   protected $columnMap = [
        'customerId' => 'customer_id',
        'billedDate' => 'billed_date',
        'paidDate' => 'paid_date',
    ];

    protected $operatorMap = [
        "eq" => "=",
        "lt" => "<",
        "lte" => "<=",
        "gt" => ">",
        "gte" => ">=",
        "neq" => "!=",
    ];
}
```
3. Modify the `public function index(Request $request)` inside the class  **InvoicesController.php**
```php
    public function index(Request $request)
    {
        $filter = new InvoicesFilter();
        $queryItems = $filter->transform($request); 
        if (count($queryItems) == 0) {
            return new InvoiceCollection(Invoice::paginate());
        }
        else {
            // this will fix the issue of losing query parameters in pagination links
            $invoice = Invoice::where($queryItems)->paginate();
            return new InvoiceCollection($invoice->appends($request->query()));
        }
    }
```
4. Modify the name spaces inside the class  **InvoicesController.php**
```php
use App\Filters\V1\InvoicesFilter;
```
5. Veify the results:
- Check all the invoices which are not paid `http://localhost:8080/api/v1/invoices?status[neq]=P`

## More Data
- we need more data
```php
http://localhost:8080/api/v1/customers?includeInvoices=False&name[eq]=Mabelle%20Schneider
```