const fs = require('fs');

let imageCode = fs.readFileSync('src/lib/imageUtils.ts', 'utf-8');
imageCode = imageCode.replace('const MAX_SIZE = 600;', 'const MAX_SIZE = 400;');
imageCode = imageCode.replace('resolve(canvas.toDataURL(\'image/jpeg\', 0.4));', 'resolve(canvas.toDataURL(\'image/jpeg\', 0.3));');
fs.writeFileSync('src/lib/imageUtils.ts', imageCode);
