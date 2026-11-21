<html><head></head><body><h1>Media System — DoD Verification Steps</h1>
<h2>Prerequisites</h2>
<ul>
<li>Server is running: <code>php artisan serve</code></li>
<li>GD extension installed: <code>php -m | grep gd</code></li>
<li>Storage symlink created: <code>php artisan storage:link</code></li>
<li>Valid Bearer token saved as <code>$ADMIN_TOKEN</code></li>
</ul>
<hr>

<h2>Step 1 — Upload an image to a venue</h2>
1. Create Tokens
<pre><code class="language-bash">ADMIN_TOKEN=$(curl -s -X POST http://localhost:8000/api/v1/login \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{"email":"admin@eventy.com","password":"password123"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")
</code></pre>

2. Upload the image (e.g `/home/aq/git/eventy-backend/test_donald.png`)
<pre><code class="language-bash">curl -X POST "http://127.0.0.1:8000/api/v1/venues/1/media" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -F "file=@/home/aq/git/eventy-backend/test_donald.png" \
  -F "is_featured=1" \
  -F "order=1"
</code></pre>

<p>✅ Expected:</p>
<pre><code class="language-json">{
  "id": 1,
  "type": "image",
  "url": "http://localhost:8000/storage/venues/1/images/abc123.png",
  "thumbnail": "http://localhost:8000/storage/venues/1/images/thumb_abc123.png",
  "is_featured": true,
  "order": "1"
}
</code></pre>
<hr>
<h2>Step 2 — Files stored correctly</h2>
<pre><code class="language-bash">ls ~/git/eventy-backend/storage/app/public/venues/1/images/
</code></pre>
<p>✅ Expected: both original and <code>thumb_</code> files present</p>
<hr>
<h2>Step 3 — DB entry created with URLs</h2>
<pre><code class="language-bash">php artisan tinker --execute="print_r(App\Models\Media::latest()-&gt;first()-&gt;toArray());"
</code></pre>
<p>✅ Expected: record with <code>path</code>, <code>thumbnail_path</code>, <code>full_url</code>, <code>full_thumbnail_url</code> all populated</p>
<hr>
<h2>Step 4 — Thumbnail accessible via HTTP</h2>
<pre><code class="language-bash"># Replace with your actual thumbnail filename from Step 1
curl -s -o /dev/null -w "%{http_code}" \
  http://localhost:8000/storage/venues/1/images/thumb_abc123.png
</code></pre>
<p>✅ Expected: <code>200</code></p>
<hr>
<h2>Step 5 — Featured image logic (only one featured per venue)</h2>
<pre><code class="language-bash"># Upload a second image as featured
curl -X POST "http://127.0.0.1:8000/api/v1/venues/1/media" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -F "file=@/path/to/your/image2.png" \
  -F "is_featured=1" \
  -F "order=2"
# Check that only the latest one is featured
php artisan tinker --execute="print_r(App\Models\Media::where('venue_id',1)-&gt;get(['id','is_featured','order'])-&gt;toArray());"
</code></pre>
<p>✅ Expected: only the last uploaded image has <code>is_featured = 1</code></p>
<hr>
<h2>Step 6 — List all media for a venue</h2>
<pre><code class="language-bash">curl -s "http://127.0.0.1:8000/api/v1/venues/1/media" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | python3 -m json.tool
</code></pre>
<p>✅ Expected: array of media objects ordered by <code>order</code> field</p>
<hr>
<h2>Step 7 — Reorder and update featured flag</h2>
<pre><code class="language-bash"># Replace 1 with your actual media ID
curl -s -X PUT "http://127.0.0.1:8000/api/v1/venues/1/media/1/reorder" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"order": 5, "is_featured": true}' | python3 -m json.tool
</code></pre>
<p>✅ Expected: <code>200</code> with updated media object</p>
<hr>
<h2>Step 8 — Delete media</h2>
<pre><code class="language-bash">curl -s -X DELETE "http://127.0.0.1:8000/api/v1/venues/1/media/1" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | python3 -m json.tool
</code></pre>
<p>✅ Expected: <code>{"message": "Media deleted successfully"}</code></p>
<hr>
<h2>Storage Structure</h2>
<pre><code>storage/app/public/
└── venues/
    └── {venue_id}/
        └── images/
            ├── abc123.png          ← original
            └── thumb_abc123.png    ← auto-generated thumbnail (300x300)
</code></pre>
<hr>
<h2>Summary</h2>

DoD Item | Expected Result | Status
-- | -- | --
Files stored correctly | Original + thumbnail in storage/venues/{id}/images/ | ✅
DB entries created with URLs | path, thumbnail_path, full_url all populated | ✅
Thumbnail generation working | thumb_ file accessible via HTTP 200 | ✅
Featured image logic | Only one featured image per venue | ✅
Ordering works | Media returned ordered by order field | ✅
Delete cleans up storage | Files removed from disk and DB | ✅

</body></html>