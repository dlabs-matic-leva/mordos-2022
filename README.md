# Web fundamentals 2022

Heya anybody who's reading this, I'm so excited to show  my OS. 👋 

I didn't implement all the features because I was focusing on stuff that was cool and challenging. To make it easy for 
Nejc, you can find a list of features I did at the end of readme.

First of all, I used native Web components and vanilla JS + CSS. I also didn't use any kind of build system 
(Gulp, Webpack) nor Typescript compiler. All I used is simple static server and Nodemon to restart it, check 
package.json and nodemon.json for a setup. Website is deployed as Github page and because I don't have build step, I can
just push the code and Github serves it as it is. Check it out: https://dlabs-matic-leva.github.io/mordos-2022/. 

Writing Web components was challenging at first because it's so different from what I was doing last 5 years. Entire 
mindset is different. With React, components should be pure function `(state) => HTML` but with Web components, 
HTML is state. Let's say you wish to display 5 windows. With React you would have an array of 5 objects and some TSX
to map this to "HTML" but with Web components you would simply create 5 HTMLElements and append them to page. To change 
position of specific window you would change array in React but with Web components you would update style of HTMLElement
directly. You just do things differently... Also, we are hardwired that each component in React has a single render (duh)
but in Web components it makes a lot of sense to have #render function that is run once when component is mounted but 
then smaller "#update" functions that are tailored to their use-case, usually serving as event listeners. I see a lot 
of parallels between Web components and Svelte...

Also, TS is pointless, HTML arguments are all strings and `tsc` doesn't compile HTML anyway. JSDoc is still useful for
function calls inside single components though. I imagine you could use Typescript for this, but I find TS' biggest 
strength is TSX and prop checking, and you simply can't get this with Web components.

I also made a mistakes along the way. I was treating shadow dom and scoped CSS as substitute for Webpack's CSS modules
but in reality it behaves differently. Shadow DOM doesn't just stop CSS styles from leaking into it, but it also 
completely encapsulates anything inside it. Imagine CSS selector `:host::before{}`; where do you think is ::before 
pseudo-element? Certainly not in shadow DOM, I can tell you that. It's going to appear inside host element but after 
shadow DOM, meaning after all elements that are inside shadow DOM. That's just one of the behaviours I was stumped by. 
In hindsight, I would avoid shadow DOM and scoped CSS and use battle-tested BEM to keep structured CSS. The only use-case
for shadow DOM (in my opinion) is in the case you wish to create encapsulated component that is going to be included
in 3rd party app. If you control component and app, don't over-complicate your life imho.

So, cool shit I did in this app:
* Tag based File manager. There are no directories, but you can add tags to any file and then filter by these tags.
I imagine users would create tag "Project Elrond" and then add this tag to all related files. Upside of this 
approach is that each file can belong to multiple directories/projects. We can also automatically generate system
tag based on file properties (author, date created, file type, etc.), also showcased in app.
* File manage is using `contextmenu` event for context menu, supporting right click and long press on touch devices 
without complicated code.
* Notes app supports rich text, try bolding text (Cmd+B) or pasting image.
* All file previews in File manager are draggable. If you attempt to drag preview of note into any app that supports
right text, text from note will be copied to this app. This feature is using [drag types](https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API/Recommended_drag_types#dragging_html_and_xml).
* Innovative tiling window manager. I mean, it's not that innovative, it's been around for 40 years 😅. Anyway, approach
any edge of app until you see an indicator to split your screen. Click it and screen will split in 2. You can also repeat
that as many times as you want and in any direction you want. Close any app by hovering over top right corner.

## Checklist:

* [x] directory mechanic for managing folders, files and applications
  * kinda has it but differently, it uses tags
* [x] plain text editor
* [ ] simple authentication feature
* [ ] some form of customisation and configurability
* [x] day and night modes
  * it will respond to native dark mode
* [x] look familiar to other systems (probably)
* [ ] RSS reader
* [x] camera app
* [ ] 80s filter
* [x] Gallery app
  * click on any image in Files app
* [ ] images from different sources
* [ ] dedicated web browser
* [x] fault-tolerant file removal system
