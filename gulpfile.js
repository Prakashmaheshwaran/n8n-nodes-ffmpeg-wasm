const gulp = require('gulp');
const svgmin = require('gulp-svgmin');

// Optimize SVG icons
function buildIcons() {
  return gulp
    .src('nodes/**/*/*.svg')
    .pipe(svgmin({
      plugins: [
        { removeViewBox: false },
        { removeDimensions: true }
      ]
    }))
    .pipe(gulp.dest('dist'));
}

// Watch for changes
function watch() {
  gulp.watch('nodes/**/*.svg', buildIcons);
}

// Export tasks
exports['build:icons'] = buildIcons;
exports.watch = watch;
exports.default = buildIcons;
