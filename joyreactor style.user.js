// ==UserScript==
// @name         joyreactor style
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       Serbis
// @include      /^https://.*reactor\.cc/.*$/
// @icon         https://joyreactor.cc/favicon.ico
// @grant        GM_addStyle
// @run-at       document-start
// ==/UserScript==

GM_addStyle(`
#header,
div[id^='ads_holder'],
div[id^='yandex']{
    display: none !important;
}
#page{
    width: auto !important;
}
#pageinner,
#blogHeader,
#contentinner{
    background-color: #ECE9D9 !important;
}

div.logo {
    display: none !important;
}
div.jr-container,
div#__next,
div.content-container {
    width: 100% !important;
}`);