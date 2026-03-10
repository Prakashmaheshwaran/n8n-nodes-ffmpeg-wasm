const gulp = require('gulp');
const svgmin = require('gulp-svgmin');

// Optimize SVG icons
function buildIcons() {
  return gulp
    .src('nodes/**/*.svg')
    .pipe(svgmin({
      plugins: [
        { name: 'removeViewBox', active: false }
      ]
    }))
    .pipe(gulp.dest('dist/nodes'));
}

// Watch for changes
function watch() {
  gulp.watch('nodes/**/*.svg', buildIcons);
}

// Export tasks
exports['build:icons'] = buildIcons;
exports.watch = watch;
exports.default = buildIcons;
