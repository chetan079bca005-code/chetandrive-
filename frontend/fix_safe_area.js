const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      if (!file.includes('node_modules')) {
        results = results.concat(walk(file));
      }
    } else {
      if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk(path.join(__dirname, 'src'));
let modified = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  if (content.includes('SafeAreaView')) {
    let lines = content.split('\n');
    let hasRNImport = false;
    for (let i = 0; i<lines.length; i++) {
        if (lines[i].includes('react-native') && lines[i].includes('SafeAreaView') && !lines[i].includes('react-native-safe-area-context')) {
            lines[i] = lines[i].replace(/,\s*SafeAreaView/, '').replace(/SafeAreaView\s*,/, '').replace(/{\s*SafeAreaView\s*}/, '{}');
            if (lines[i].includes('{}')) {
                 lines[i] = lines[i].replace(/import\s*{}\s*from\s*['"]react-native['"];?/, '');
            }
            changed = true;
            hasRNImport = true;
        }
    }
    
    if (hasRNImport) {
        const safeAreaImport = "import { SafeAreaView } from 'react-native-safe-area-context';";
        if (!content.includes(safeAreaImport) && !lines.some(l => l.includes('react-native-safe-area-context'))) {
             let insertIdx = 0;
             for(let i=0; i<lines.length; i++) {
                 if (lines[i].startsWith('import ')) {
                     insertIdx = i;
                     break;
                 }
             }
             lines.splice(insertIdx, 0, safeAreaImport);
        }
        content = lines.join('\n');
        fs.writeFileSync(file, content);
        modified++;
        console.log('Fixed:', file);
    }
  }
});

console.log('Total fixed:', modified);
