<html><head></head><body><h1>Payment System — DoD Verification Steps</h1>
<h2>Prerequisites</h2>
<ul>
<li>Server is running: <code>php artisan serve</code></li>
<li>Database is migrated: <code>php artisan migrate</code></li>
</ul>
<hr>
<h2>Step 1 — Login as Admin</h2>
<pre><code class="language-bash">ADMIN_TOKEN=$(curl -s -X POST http://localhost:8000/api/v1/login \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{"email":"admin@eventy.com","password":"password123"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")

echo $ADMIN_TOKEN
</code></pre>
<p>✅ Expected: token printed in terminal</p>
<hr>
<h2>Step 2 — Login as Regular User</h2>
<pre><code class="language-bash">USER_TOKEN=$(curl -s -X POST http://localhost:8000/api/v1/login \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{"email":"user@eventy.com","password":"password123"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")

echo $USER_TOKEN
</code></pre>
<p>✅ Expected: token printed in terminal</p>
<hr>
<h2>Step 3 — Admin can view ALL payments</h2>
<pre><code class="language-bash">curl -s http://localhost:8000/api/v1/payments \
  -H "Accept: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | python3 -m json.tool | head -30
</code></pre>
<p>✅ Expected: paginated list of all payments across all users and venues</p>
<hr>
<h2>Step 4 — User can only view their OWN payments</h2>
<pre><code class="language-bash">curl -s http://localhost:8000/api/v1/payments \
  -H "Accept: application/json" \
  -H "Authorization: Bearer $USER_TOKEN" | python3 -m json.tool | head -30
</code></pre>
<p>✅ Expected: only payments belonging to the logged-in user</p>
<hr>
<h2>Step 5 — User can create a payment</h2>
<pre><code class="language-bash">curl -s -X POST http://localhost:8000/api/v1/payments \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -d '{
    "booking_id": 1,
    "provider": "stripe",
    "amount": 500,
    "currency": "EGP"
  }' | python3 -m json.tool
</code></pre>
<p>✅ Expected: <code>201</code> with payment object, <code>status: pending</code>, <code>user_id</code> auto-set to logged-in user</p>
<hr>
<h2>Step 6 — User CANNOT delete a payment (403)</h2>
<pre><code class="language-bash">curl -s -X DELETE http://localhost:8000/api/v1/payments/1 \
  -H "Accept: application/json" \
  -H "Authorization: Bearer $USER_TOKEN" | python3 -m json.tool
</code></pre>
<p>✅ Expected: <code>403 Forbidden</code></p>
<hr>
<h2>Step 7 — User CANNOT update a payment (403)</h2>
<pre><code class="language-bash">curl -s -X PUT http://localhost:8000/api/v1/payments/1 \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -d '{"status": "paid"}' | python3 -m json.tool
</code></pre>
<p>✅ Expected: <code>403 Forbidden</code></p>
<hr>
<h2>Step 8 — Admin CAN update a payment</h2>
<pre><code class="language-bash">curl -s -X PUT http://localhost:8000/api/v1/payments/1 \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"status": "paid"}' | python3 -m json.tool
</code></pre>
<p>✅ Expected: <code>200</code> with updated payment object showing <code>status: paid</code></p>
<hr>
<h2>Step 9 — Admin can view a specific payment</h2>
<pre><code class="language-bash">curl -s http://localhost:8000/api/v1/payments/1 \
  -H "Accept: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | python3 -m json.tool
</code></pre>
<p>✅ Expected: full payment object</p>
<hr>
<h2>Step 10 — Admin CAN delete a payment</h2>
<pre><code class="language-bash">curl -s -X DELETE http://localhost:8000/api/v1/payments/1 \
  -H "Accept: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | python3 -m json.tool
</code></pre>
<p>✅ Expected: <code>200</code> — payment deleted successfully</p>
<hr>
<h2>Request / Response Flow</h2>
<pre><code>POST /payments
  ↓ StorePaymentRequest::authorize() → check role
  ↓ StorePaymentRequest::rules()     → validate fields
  ↓ PaymentController::store()       → business logic
  ↓ PaymentResource                  → format response
</code></pre>
<hr>
<h2>Role Permission Matrix</h2>

Action | Admin | Venue Owner | User
-- | -- | -- | --
View all | ✅ | Own venues | Own only
View specific | ✅ | Own venues | Own only
Create | ✅ | ❌ | ✅
Update | ✅ | ❌ | ❌
Delete | ✅ | ❌ | ❌

</body></html>