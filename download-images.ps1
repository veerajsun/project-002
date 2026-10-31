$base = "https://sabaland.in/cdn/shop/files/"
$dest = Join-Path $PSScriptRoot "public\images\products"
New-Item -ItemType Directory -Force -Path $dest | Out-Null

$files = @(
  # 0.5 kg
  @{ local="khalta-500g-1.jpg";  remote="khaltahoney.jpg?v=1777177618" },
  @{ local="khalta-500g-2.jpg";  remote="yemini_honey_khalta_honey.jpg?v=1774153307" },
  @{ local="khalta-500g-3.webp"; remote="khalta_Honey.webp?v=1774118835" },
  @{ local="khalta-500g-4.webp"; remote="khalta_honey_a2d27552-040f-460f-b89d-61042e0594f4.webp?v=1774118835" },
  @{ local="khalta-500g-5.webp"; remote="khalta_yemini.webp?v=1774153408" },
  @{ local="khalta-500g-6.webp"; remote="khalta.webp?v=1774118835" },
  # 1 kg
  @{ local="khalta-1kg-1.png";   remote="wellness-supplement-product-image_1ecbe715-62d5-4fa2-9d33-1f18b6fd0e61.png?v=1774118826" },
  @{ local="khalta-1kg-2.jpg";   remote="product_01722654969_thumb_1_00ca43f8-150a-405c-8fab-f17f8405f87d.jpg?v=1774118826" },
  @{ local="khalta-1kg-3.webp";  remote="couple-with-1kg-round-khalta.webp?v=1774118825" },
  @{ local="khalta-1kg-4.webp";  remote="1kg-round-khalta-top-view.webp?v=1774118825" },
  @{ local="khalta-1kg-5.webp";  remote="diagonal-angle-honey-jars.webp?v=1774118826" },
  # 250 g Course
  @{ local="khalta-250g-course-1.jpg"; remote="WhatsAppImage2026-03-22at4.31.23PM_2.jpg?v=1774177910" },
  @{ local="khalta-250g-course-2.jpg"; remote="WhatsAppImage2026-03-22at4.31.23PM_1.jpg?v=1774177910" },
  @{ local="khalta-250g-course-3.jpg"; remote="WhatsAppImage2026-03-22at4.31.23PM.jpg?v=1774177910" },
  # 250 g Direct
  @{ local="khalta-250g-direct-1.jpg"; remote="sabaland_khalta_honey.jpg?v=1774178067" },
  @{ local="khalta-250g-direct-2.jpg"; remote="khalta_honey.jpg?v=1774153670" }
)

foreach ($item in $files) {
  $out = Join-Path $dest $item.local
  try {
    Invoke-WebRequest -Uri ($base + $item.remote) -OutFile $out -UserAgent "Mozilla/5.0" -UseBasicParsing -ErrorAction Stop
    Write-Host ("OK    {0}  ({1} KB)" -f $item.local, [math]::Round((Get-Item $out).Length / 1KB))
  } catch {
    Write-Host ("FAIL  {0}  - {1}" -f $item.local, $_.Exception.Message) -ForegroundColor Red
  }
}
