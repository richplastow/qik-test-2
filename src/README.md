# qik-test-2

## Just Indented

Here’s some standard JavaScript:

    var abc = 123;
    function foo () {
      return 'bar!';
    }

And _here’s_ some ES6, with minimal punctuation:

    const ABC = 456
    let foo = arg => {
      if (arg)
        return 'ok!'
    }

- GitHub is able to style the markdown, but not the code
- Atom is able to highlight the markdown, but not the code
- Sublime 2 does a bad job of this - maybe an update is in order..?
- Visual Studio Code is able to highlight the markdown, but not the code

## Fenced code blocks, labelled either 'js' or 'JavaScript'

```js
    var abc = 123;
    function foo () {
      return 'bar!';
    }
```

```JavaScript
    const ABC = 456
    let foo = arg => {
      if (arg)
        return 'ok!'
    }
```

- GitHub highlights the code here
- Atom highlights the code here
- Sublime 2 does a bad job of this - maybe an update is in order..?
- Visual Studio Code understands 'js' but not 'JavaScript'
