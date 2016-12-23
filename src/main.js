//// Main
//// ----
////
//// #### The starting-point.

//// Here’s some ES6:

!function (ROOT, LIFE, DEPS) { var NAME='main'

// import firstSection  from './another-plugin/first-section'
// import secondSection from './another-plugin/second-section'
DEPS(
  './another-plugin/first-section'
 ,'./another-plugin/second-section'
 ,(firstSection, secondSection) => {

  var abc = 123;
  LIFE.foo = function (arg) {
    return arg + ' ' + 123 + ' bar! ' + typeof Promise;
  }

})



}( 'object' == typeof global ? global : this, 'object' == typeof global ?
    global.LIFE = global.LIFE || {} : this.LIFE = this.LIFE || {}
  , function () { arguments[arguments.length-1]() } //@next
)
