const fs = require('fs');
let code = fs.readFileSync('src/lib/imageUtils.ts', 'utf-8');
code = code.replace('resolve(canvas.toDataURL(\'image/jpeg\', 0.3));', 'resolve(canvas.toDataURL(\'image/webp\', 0.4));');
fs.writeFileSync('src/lib/imageUtils.ts', code);
