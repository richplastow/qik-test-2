/* -------------------------------------------------------------------------- */
/* Node.js script which concatenates and minifies the ‘src/’ files into       */
/* ‘dist/[NAME].js’ and ‘dist/[NAME].min.js’.                                 */
/* -------------------------------------------------------------------------- */

const PACKAGE  = require('./package.json')
    , NAME     = PACKAGE.name
    , VERSION  = PACKAGE.version
    , HOMEPAGE = PACKAGE.homepage
    , REPO     = PACKAGE.repository.url.slice(4, -4)
    , fs = require('fs')
    , path = require('path')
    , uglify = require('uglify-js') // probs? Try `$ npm install -g uglify-js`
    , maxs = []
    , codes = []

//// Get names of directories in ‘src’.
fs.readdirSync('src').forEach( topName => {
  if ( fs.statSync( path.resolve('src', topName) ).isDirectory() )
    processDir(topName)
})

////
function processDir (topName) {
  const srcNames  = fs.readdirSync( path.resolve('src', topName) )
      , rawNames  = [] // `srcNames` which are JavaScript files
      , processed = []
  srcNames.forEach( srcName => {
    if ( '.js' === srcName.slice(-3) ) rawNames.push(srcName)
  })
  rawNames.forEach( rawName => {
    processed.push( processRaw( ['src', topName, rawName].join('/') ) )
  })
  fs.writeFileSync(
    path.resolve('src', topName, 'README.md'), processed.join('\n\n')
  )
}

////
function processRaw (relPath) {
  let nowInCode = false
    , cutAt = null
    , out = ['#### ['+relPath+']('+REPO+'/blob/master/'+relPath+')', '' ]
    , absPath = path.resolve(relPath)
  ;
  (fs.readFileSync(absPath)+'').split('\n').forEach( (line) => {
    if (! line.trim() ) {
      if (! cutAt) cutAt = out.length       // make a note of where blank begins
      out.push('')                          // preserve blank lines
    } else if ( '////' === line.substr(0, 4) ) {
      if (nowInCode) {
        if (cutAt) out = out.slice(0,cutAt) // remove unnecessary blank lines
        out.push('```','')                  // switch from in-code to in-comment
      }
      out.push( line.substr(4).trim() )     // add the comment (now markdown)
      nowInCode = false                     // we are currently in a comment
      cutAt = null                          // not in a run of blank lines
    } else {
      if (! nowInCode) {
        if (cutAt) out = out.slice(0,cutAt) // remove unnecessary blank lines
        out.push('','```js') // switch from in-comment to in-code
      }
      out.push(line)                        // add the code (no need to indent)
      nowInCode = true                      // we are currently in code
      cutAt = null                          // not in a run of blank lines
    }
  })
  if (nowInCode) out.push('```')            // complete fenced code, if needed
  out.push('','***')                        // always end with an <HR>
  return out.join('\n')
}



/*
//// Check that error codes are unique.
maxs.forEach( (max, i) => {
  const fails = max.match(/\sFAIL\s*\(([^\)]+,\s*\d{4}\s*)\)/mg)
  if (! fails) return
  fails.forEach( (fail, j) => {
    if (! fail) return
    const codeMatch = fail.match(/,\s*(\d{4})\s*\)$/m)
    const code = +codeMatch[1]
    if (codes[code])
      throw new Error(`${srcNames[i]}:${j} and ${codes[code]} both use ${code}`)
    codes[code] = `${srcNames[i]}:${j}`
  })
})

//// Remove lines marked `//@CUT`.
maxs.forEach( (max, i) => {
  const lines = max.split('\n')
  for (var j=0, line; null != (line=lines[j]); j++)
    if (/\s*\/\/\s*@CUT\s*$/.test(line) ) lines.splice(j--, 1)
  maxs[i] = lines.join('\n')
})

//// Modify 'boot' so that it expects units to be loaded inline.
maxs.forEach ( (max, i) => {
  if (NAME+'-boot.js' === srcNames[i]) {
    srcNames.forEach( srcname => {
      maxs[i] = maxs[i].replace(
        RegExp(
          [
            "{","is",":","'booting'",",","src",":",`'src/${srcname}'`,"}"
          ].join('\\s*')
        )
       ,"{ is:'booting', src:'inline' }"
      )
    })
  }
})

//// Top and tail the concatenated JavaScript.
maxs.unshift(
  `//// ${NAME}@${VERSION} ${HOMEPAGE} \n`
 +"!function (ROOT, LIFE) { 'use strict'; var FILE='dist/"+NAME+".js'"
)
maxs.push(
  "//// LIFE helper functions are easy to recognise - they are all uppercase,\n"
 +"//// and all four characters long.\n"
 +"function SAFE (v,t) { // makes any kind of variable safe for logging\n"
 +"  t = t || typeof v\n"
 +"  if ( null == v || 'number' == t || 'boolean' == t ) return '`'+v+'`'\n"
 +"  v += '' // convert `v` to a string\n"
 +"  return '\"'+( 17 > v.length ? v : v.slice(0,8)+'...'+v.slice(-5) )+'\"'\n"
 +"}\n"
 +"function COPY (subject, fallback, key, val) { // doesn’t overwrite data\n"
 +"  for (key in fallback) {\n"
 +"    val = fallback[key]\n"
 +"    if ('object' == typeof val) {\n"
 +"      if (null == subject[key])\n"
 +"        subject[key] =\n"
 +"          '[object Array]' == Object.prototype.toString.call(val)?[]:{}\n"
 +"      COPY(subject[key], val)\n"
 +"    } else {\n"
 +"      if (null == subject[key]) subject[key] = val\n"
 +"    }\n"
 +"  }\n"
 +"}\n"
 +"function FAIL (fn, tx, cd) { // with 1 arg, `fn` is treated as `cd`\n"
 +"  (ROOT.LERT||ROOT.alert||NOOP)(FILE+' '+(tx?fn+'#'+cd+'\\n  '+tx:'#'+fn))\n"
 +"  return (tx ? cd : fn)\n"
 +"}\n"
 +"function NOOP () {} // no operation\n\n"
 +"}( 'object' == typeof global ? global : this, // Node’s root, else window \n"
 +"   'object' == typeof global ? // create the LIFE object if not predefined\n"
 +"     global.LIFE = global.LIFE || {} : this.LIFE = this.LIFE || {} )\n"
)

//// Write the concatenated JavaScript to disk.
fs.writeFileSync( path.resolve('dist', 'life.js'), maxs.join('\n\n') )
console.log(`Created dist/${NAME}.js from ${maxs.length} sources`)

//// Remove the function-name and message arguments of `FAIL()` calls, leaving
//// just the fail-code.
maxs.forEach( (max, i) => {
  if (i == maxs.length-1) return // `FAIL()` definition, just added above
  var parts=max.split(/[ \t]+FAIL\s*\(/), j, part, match
  for (j=1; part=parts[j]; j++) { // `j=1`, so skip the first part
    match = part.match(/\s*,\s*(\d{4})\s*\)/)
    if (null === match)
      throw Error(`FAIL() #${j} in ${srcNames[i-1]} has an invalid error-code`)
    parts[j] = ` FAIL(${match[1]})${part.substr(match.index+match[0].length)}`
  }
  maxs[i] = parts.join('')
})

//// Change the `FILE` variable to the minified filename.
maxs.shift()
maxs.unshift(
  "!function (ROOT, LIFE) { 'use strict'; var FILE='dist/"+NAME+".min.js'"
)

//// Hack Uglify, to avoid warnings we don’t care about.
var origWarn = uglify.AST_Node.warn;
uglify.AST_Node.warn = function(txt, props) {
  if (! (
       'Dropping unused variable {name} [{file}:{line},{col}]' == txt
    && 'FN' == props.name // 'WARN: Dropping unused variable FN [...]'
  ) ) origWarn(txt, props)
};

//// Minify the concatenated JavaScript, and write it to disk.
const min = uglify.minify( maxs.join('\n\n'), {
  fromString: true,
  outFileName: path.resolve('dist', 'life.min.js'),
  // outSourceMap: path.resolve('dist', 'life.min.map.js'),
  warnings: true,
  // drop_console: true,
  // passes: 4,
  output: {
    max_line_len: 64 // easier on the eye - but 500 would be a safe maximum
  },
  compress: {
    dead_code: true,
    global_defs: {
      DEBUG: false
    }
  }
})

fs.writeFileSync(
  path.resolve('dist', NAME+'.min.js')
 ,`//// ${NAME}@${VERSION} ${HOMEPAGE} \n${min.code}`
)
// fs.writeFileSync( path.resolve('dist', NAME+'.min.map.js'), min.map )

//// Calculate and display the amount of compression.
const maxSize = fs.statSync( path.resolve('dist', NAME+'.js') ).size
    , minSize = fs.statSync( path.resolve('dist', NAME+'.min.js') ).size
    , maxK = (maxSize / 1024).toPrecision(4)
    , minK = (minSize / 1024).toPrecision(4)
    , pc = (minSize / maxSize * 100).toPrecision(4)
console.log(
  `Created dist/${NAME}.min.js, which is ${minK} KB (${pc}% of ${maxK} KB)`
)
*/
