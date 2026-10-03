# 💌 A Letter For You

An animated greeting card website. It opens with a floating card and a
"click me" hint. When clicked, the card opens and is laid down at the bottom
of the page, hearts float up out of it, and a frosted-glass "magnifying" label
rises above it to show the letter, typed out one letter at a time.

Pure HTML/CSS/JS, no build step.

## Write your message

Open `script.js` and edit the `LETTER` block at the very top:

```js
const LETTER = {
  to: "You",                 // front of the card: "For You"
  greeting: "My dearest,",   // first line of the letter ("" → "Dear <to>,")
  message: [ "paragraph one", "paragraph two" ],
  signature: "Forever yours,\n— Me",
};
```

You can also personalise the name with a link: `index.html?to=Sam`.

## View it

Open `index.html` in a browser, or publish it for free with **GitHub Pages**:
repository **Settings → Pages → Deploy from a branch**, pick the branch and
`/ (root)`, then share the URL it gives you.
