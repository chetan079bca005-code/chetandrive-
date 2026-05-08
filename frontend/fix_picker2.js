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
  if (content.includes('ImagePicker.MediaTypeOptions')) {
     content = content.replace(/ImagePicker\.MediaTypeOptions\./g, '');
     content = content.replace(/mediaTypes:\s*Images/g, "mediaTypes: ['images']");
     content = content.replace(/mediaTypes:\s*Videos/g, "mediaTypes: ['videos']");
     content = content.replace(/mediaTypes:\s*All/g, "mediaTypes: ['images', 'videos']");
     // in case of other matches:
     content = content.replace(/ImagePicker\.MediaTypeOptions/g, 'ImagePicker.MediaType');
     content = content.replace(/mediaTypes:\s*ImagePicker\.MediaType\.Images/g, "mediaTypes: ['images']");
     content = content.replace(/mediaTypes:\s*ImagePicker\.MediaType\.Videos/g, "mediaTypes: ['videos']");
     content = content.replace(/mediaTypes:\s*ImagePicker\.MediaType\.All/g, "mediaTypes: ['images', 'videos']");
     
     fs.writeFileSync(file, content);
     modified++;
     console.log('Fixed:', file);
  }
});
console.log('Total fixed:', modified);
