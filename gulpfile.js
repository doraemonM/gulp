var gulp = require('gulp');
var uglify = require('gulp-uglify');
var concat = require('gulp-concat');
var minifycss = require('gulp-minify-css');
var minifyhtml = require('gulp-minify-html');
var newer = require('gulp-newer');
var browserSync = require('browser-sync').create();
var browserify = require('browserify');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var imagemin = require('gulp-imagemin');
var pngquant = require('imagemin-pngquant');
var sass = require('gulp-sass');
var sourcemaps = require('gulp-sourcemaps');
var autoprefixer = require('gulp-autoprefixer');
var csslint = require('gulp-csslint');
var cached = require('gulp-cached');
var remember = require('gulp-remember');
var plumber = require('gulp-plumber');
var runSequence = require('run-sequence');

var errorHandler = function (error) {
    console.error(error.message);
    this.emit('end');
};

var plumberOption = {
    errorHandler: errorHandler
}

var src = 'project/source'; //기존 소스파일
var dist = 'project/finish'; //최종 배포파일

var paths = {
    js: src + '/js/*.js',
    scss: src + '/scss/*.scss',
    html: src + '/**/*.html',
    css: src + '/css/*.css',
    image : [src+'/**/*.png',src+'/**/*.jpg',src+'/**/*.gif',src+'/**/*.jpeg']
};



//dist 폴더를 기준으로 웹서버 실행
gulp.task('server', ['uglify', 'minifycss' , 'minifyhtml' , 'imagemin' , 'sass' ], function () {
    return browserSync.init({
        server: {
            baseDir: dist
        }
    });
});

//HTML 파일을 dist로 옮김
gulp.task('minifyhtml', function () {
    return gulp.src(paths.html) //src 폴더 아래의 모든 html 파일을       
        .pipe(plumber(plumberOption))
        .pipe(newer('dist'))
        .pipe(gulp.dest(dist)) //dist 폴더에 저장
        .pipe(browserSync.reload({stream:true})); //browserSync 로 브라우저에 반영
});


//자바스크립트 파일을 browserify로 번들링
gulp.task('uglify', function () {
    return browserify(src+'/js/main.js')
        .bundle() //browserify로 번들링
        .on('error', errorHandler)
        .pipe(source('main.js')) //vinyl object 로 변환
        .pipe(buffer()) //buffered vinyl object 로 변환
        .pipe(plumber(plumberOption))
        .pipe(uglify()) //minify 해서
        .pipe(gulp.dest(dist+'/js')) //dist 폴더에 저장
        .pipe(browserSync.reload({stream:true})); //browserSync 로 브라우저에 반영
});

//CSS 파일을 minify
gulp.task('minifycss', function () {
    return gulp.src(paths.css) //src 폴더 아래의 모든 css 파일을   
        .pipe(csslint())
        .pipe(csslint.reporter())
        .pipe(sourcemaps.init())
        .pipe(autoprefixer({ browsers: ['last 2 versions', 'safari 5', 'opera 12.1', 'ios 6', 'android 4'] }) )
        .pipe(sourcemaps.write('.'))  
        .pipe(concat('main.css')) //병합하고
        .pipe(minifycss()) //minify 해서        
        .pipe(gulp.dest(dist+'/css')) //dist 폴더에 저장
        .pipe(browserSync.reload({stream:true})); //browserSync 로 브라우저에 반영
});

//이미지 파일을 압축
gulp.task('imagemin', function(cb) {
      return gulp.src(paths.image)		
        .pipe(newer(dist))
        .pipe(imagemin({
            progressive: true,
            svgoPlugins: [{removeViewBox: false}],
            use: [pngquant()]
        }))
    .pipe(gulp.dest(dist))
    .pipe(browserSync.reload({stream:true})); //browserSync 로 브라우저에 반영
});

gulp.task('sass', function () {
  return gulp.src(paths.scss)
    .pipe(sass().on('error', sass.logError))    
    .pipe(gulp.dest(src+'/css'));
});



//파일 변경 감지
gulp.task('watch', function () {
    gulp.watch(paths.js, ['uglify']);
    gulp.watch(paths.css, ['minifycss']);    
    gulp.watch(paths.html, ['minifyhtml']);    
    gulp.watch(paths.image, ['imagemin']);   
    gulp.watch(paths.scss, ['sass']);   
});




//gulp를 실행하면 start 로 minifycss task를 실행
gulp.task('start', ['server', 'watch']);
