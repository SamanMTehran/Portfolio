## Section order

Home → About → Services → Work → Contact

Plugin Lab is presented inside Services so the page flow matches the main navigation exactly.

# Saman Portfolio — Crystal Scroll V4

## اجرا

`index.html` را باز کن یا کل پوشه را روی GitHub Pages قرار بده.

## عکس پروژه‌ها

فقط فایل‌های زیر را با اسکرین‌شات واقعی پروژه‌ها جایگزین کن و اسم فایل را تغییر نده:

- `assets/projects/project-01.jpg` → Bamika
- `assets/projects/project-02.jpg` → Airomax
- `assets/projects/project-03.jpg` → Banner Designer

## فایل‌های اصلی

- `index.html` ساختار سایت
- `styles.css` ظاهر، RTL و افکت Scroll Deck
- `script.js` زبان، منو، Cursor و تعاملات سایت
- `gem.js` کریستال سه‌بعدی Procedural و تعاملی

## کریستال

کریستال Hero عکس نیست. با Canvas و JavaScript رندر می‌شود و نور، زاویه، فیس‌های سه‌بعدی، Glow و ذرات آن با حرکت موس تغییر می‌کنند.

## زبان

زبان پیش‌فرض انگلیسی است. در حالت فارسی کل Layout به RTL تغییر می‌کند و کریستال از سمت راست به سمت چپ Hero منتقل می‌شود.


V5 changes: first white panel no longer peeks into the initial hero viewport; cursor automatically switches between light-surface and dark-surface modes; section reveals now follow a deliberate staggered order.


## V8 layout update

- Sections shorter than the viewport now expand to at least one full screen.
- Sections that are naturally taller keep their original height and content flow.
- About/skills is vertically centered when it is shorter than the viewport.
- Skills use a larger bento layout, with WordPress, WooCommerce and Plugin Development emphasized.
- Desktop scrolling uses gentle proximity snap; mobile keeps normal scrolling.
