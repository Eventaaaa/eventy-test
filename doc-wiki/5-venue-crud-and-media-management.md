<html><head></head><body><h1>Venue CRUD — DoD Verification Steps</h1>
<h2>Prerequisites</h2>
<ul>
<li>Server is running: <code>php artisan serve</code></li>
<li>Database is migrated: <code>php artisan migrate</code></li>
</ul>
<hr>
<h2>Step 1 — Register an Admin user</h2>
<pre><code class="language-bash">curl -s -X POST http://localhost:8000/api/v1/register \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{"name":"Admin","email":"admin@eventy.com","password":"password123","password_confirmation":"password123","role":"admin"}'
</code></pre>
<p>✅ Expected: <code>{"token":"...","user":{"role":"admin",...}}</code></p>
<hr>
<h2>Step 2 — Login and get a token</h2>
<pre><code class="language-bash">curl -s -X POST http://localhost:8000/api/v1/login \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{"email":"admin@eventy.com","password":"password123"}'
</code></pre>
<p>✅ Expected: <code>{"token":"6|vcWMrZv49...","user":{...}}</code></p>
<hr>
<h2>Step 3 — Save the token</h2>
<pre><code class="language-bash">ADMIN_TOKEN="6|vcWMrZv49CTL3eEe5xhW1xJJZ9Y2onxhGJX3xRz0b9105960"
echo $ADMIN_TOKEN
</code></pre>
<p>✅ Expected: token printed in terminal</p>
<hr>
<h2>Step 4 — Create a Venue (POST /venues)</h2>
<pre><code class="language-bash">curl -s -X POST http://localhost:8000/api/v1/venues \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "name": "Grand Hall",
    "description": "A beautiful venue for events",
    "capacity_min": 50,
    "capacity_max": 500,
    "address": "123 Main St",
    "geo_lat": 24.7136,
    "geo_lng": 46.6753,
    "city": "Riyadh",
    "area": "Olaya",
    "is_active": true
  }' | python3 -m json.tool
</code></pre>
<p>✅ Expected: <code>201</code> with venue object including <code>id</code></p>
<p>Save the venue ID:</p>
<pre><code class="language-bash">VENUE_ID=&lt;id from response&gt;
</code></pre>
<hr>
<h2>Step 5 — Venue appears in GET /venues</h2>
<pre><code class="language-bash">curl -s http://localhost:8000/api/v1/venues \
  -H "Accept: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | python3 -m json.tool
</code></pre>
<p>✅ Expected: Paginated list containing the newly created venue</p>
<hr>
<h2>Step 6 — Get specific venue (GET /venues/{id})</h2>
<pre><code class="language-bash">curl -s http://localhost:8000/api/v1/venues/$VENUE_ID \
  -H "Accept: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | python3 -m json.tool
</code></pre>
<p>✅ Expected: Full venue object with all related data</p>
<hr>
<h2>Step 7 — Validation works (POST /venues with missing fields)</h2>
<pre><code class="language-bash">curl -s -X POST http://localhost:8000/api/v1/venues \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"name": "Incomplete Venue"}' | python3 -m json.tool
</code></pre>
<p>✅ Expected: <code>422</code> with errors for <code>capacity_min</code>, <code>capacity_max</code>, <code>address</code>, <code>city</code></p>
<hr>
<h2>Step 8 — Validation works (capacity_max &lt; capacity_min)</h2>
<pre><code class="language-bash">curl -s -X PUT http://localhost:8000/api/v1/venues/$VENUE_ID \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"capacity_min": 100, "capacity_max": 10}' | python3 -m json.tool
</code></pre>
<p>✅ Expected: <code>422</code> — "The capacity max field must be greater than or equal to capacity min."</p>
<hr>
<h2>Step 9 — Update a Venue (PUT /venues/{id})</h2>
<pre><code class="language-bash">curl -s -X PUT http://localhost:8000/api/v1/venues/$VENUE_ID \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"name": "Updated Grand Hall", "capacity_min": 50, "capacity_max": 1000}' | python3 -m json.tool
</code></pre>
<p>✅ Expected: <code>200</code> with updated venue object</p>
<hr>
<h2>Step 10 — Only owner can update their venue (403 for others)</h2>
<pre><code class="language-bash">OTHER_TOKEN="&lt;token of a different owner&gt;"

curl -s -X PUT http://localhost:8000/api/v1/venues/$VENUE_ID \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer $OTHER_TOKEN" \
  -d '{"name": "Hacked Venue"}' | python3 -m json.tool
</code></pre>
<p>✅ Expected: <code>403</code> — "Forbidden. You do not own this venue."</p>
<hr>
<h2>Step 11 — Delete a Venue (DELETE /venues/{id})</h2>
<pre><code class="language-bash">curl -s -X DELETE http://localhost:8000/api/v1/venues/$VENUE_ID \
  -H "Accept: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | python3 -m json.tool
</code></pre>
<p>✅ Expected: <code>200</code> — "Venue deleted successfully"</p>
</body></html>