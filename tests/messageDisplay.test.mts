// tests/messageDisplay.test.mts
//
// WHAT THIS PROTECTS
//
// The lead page showing what a person actually wrote.
//
// Inbound email is often stored as its HTML part, so the conversation on
// /admin/leads/[id] read as `<div dir="ltr">Sounds good<br></div><div
// class="gmail_quote">On Tue, 7 Oct … wrote:<blockquote>…` — the reply buried
// under markup and every earlier message in the thread. messageToDisplayText
// turns that into the reply, as plain text. It is display only: the stored
// body is never changed, and the page keeps the original one click away.
//
// The rule that matters most is the last one: cleaning must never produce an
// empty message. A reply that is nothing but a quote falls back to the whole
// thing rather than showing a blank bubble.
//
// All samples are synthetic.

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  messageToDisplayText,
  looksLikeHtml,
  decodeEntities,
  originalForDisplay,
} from "../app/lib/message-display.ts";

test("Gmail HTML reply: keeps the reply, drops the gmail_quote history", () => {
  const body =
    '<meta http-equiv="Content-Type" content="text/html; charset=utf-8">' +
    '<div dir="ltr">Hi Callum,<div><br></div><div>Thursday at 10 works for me.</div>' +
    "<div><br></div><div>Thanks,</div><div>Sam</div></div><br>" +
    '<div class="gmail_quote gmail_quote_container"><div dir="ltr" class="gmail_attr">' +
    "On Tue, 7 Oct 2026 at 09:12, PT Launch Lab &lt;info@example.co.uk&gt; wrote:<br></div>" +
    '<blockquote class="gmail_quote" style="margin:0px 0px 0px 0.8ex">' +
    "<div>Would Thursday suit you for a quick call?</div></blockquote></div>";
  const r = messageToDisplayText(body);
  assert.equal(r.text, "Hi Callum,\n\nThursday at 10 works for me.\n\nThanks,\nSam");
  assert.equal(r.hadQuote, true);
});

test("Outlook reply: cuts at the From:/Sent: header block", () => {
  const body = [
    "Yes please, send it over.",
    "",
    "Kind regards",
    "Jo",
    "",
    "________________________________",
    "From: PT Launch Lab <info@example.co.uk>",
    "Sent: Monday, October 6, 2026 4:15 PM",
    "To: Jo <jo@example.com>",
    "Subject: Re: Your enquiry",
    "",
    "Hi Jo, would a course outline help?",
  ].join("\r\n");
  const r = messageToDisplayText(body);
  assert.equal(r.text, "Yes please, send it over.\n\nKind regards\nJo");
  assert.equal(r.hadQuote, true);
});

test("Outlook HTML reply (divRplyFwdMsg) is cut too", () => {
  const body =
    '<html><head><style>p{margin:0}</style></head><body><div dir="ltr">' +
    '<p class="MsoNormal">Sounds great &ndash; thanks!</p></div><hr style="display:inline-block;width:98%">' +
    '<div id="divRplyFwdMsg" dir="ltr"><b>From:</b> PT Launch Lab<br><b>Sent:</b> 6 October 2026</div>' +
    "<div>Original text</div></body></html>";
  const r = messageToDisplayText(body);
  assert.equal(r.text, "Sounds great – thanks!");
  assert.equal(r.hadQuote, true);
});

test("plain text: drops 'On … wrote:' and the > lines after it", () => {
  const body = [
    "That's brilliant, thank you.",
    "",
    "On Tue, 7 Oct 2026 at 09:12, PT Launch Lab <info@example.co.uk>",
    "wrote:",
    "",
    "> Hi Alex,",
    ">",
    "> Here are the course dates.",
  ].join("\n");
  const r = messageToDisplayText(body);
  assert.equal(r.text, "That's brilliant, thank you.");
  assert.equal(r.hadQuote, true);
});

test("plain text: a trailing run of > lines with no attribution is cut", () => {
  const r = messageToDisplayText("Sounds good.\n\n> Can you do Friday?\n> Thanks");
  assert.equal(r.text, "Sounds good.");
  assert.equal(r.hadQuote, true);
});

test("-----Original Message----- marks the start of history", () => {
  const r = messageToDisplayText("See you then.\n\n-----Original Message-----\nFrom: someone\nHello");
  assert.equal(r.text, "See you then.");
  assert.equal(r.hadQuote, true);
});

test("a sentence starting 'On' and ending 'wrote:' with no date is not a quote", () => {
  const body = "On reflection, here is what my coach wrote:\nkeep going.";
  const r = messageToDisplayText(body);
  assert.equal(r.text, body);
  assert.equal(r.hadQuote, false);
});

test("entities are decoded once, named and numeric", () => {
  const r = messageToDisplayText(
    "<div>Fish &amp; chips &lt;3 &quot;yes&quot; it&#39;s &#163;20&nbsp;now &#x2014; &amp;lt;tag&amp;gt;</div>",
  );
  assert.equal(r.text, 'Fish & chips <3 "yes" it\'s £20 now — &lt;tag&gt;');
  assert.equal(decodeEntities("&unknown; &#0; &amp;"), "&unknown; &#0; &");
});

test("runs of <br> collapse to at most one blank line", () => {
  const r = messageToDisplayText("<div>Hello<br><br><br><br><br>World<br><br></div>");
  assert.equal(r.text, "Hello\n\nWorld");
});

test("a message that is ONLY a quote falls back to the whole thing, never empty", () => {
  const body =
    '<div dir="auto"></div><div class="gmail_extra"><br><div class="gmail_quote">' +
    "On 29 Sept 2026 17:07, PT Launch Lab &lt;info@example.co.uk&gt; wrote:" +
    '<blockquote class="quote"><p dir="ltr">Hi, are you still interested?<br></p></blockquote></div></div>';
  const r = messageToDisplayText(body);
  assert.ok(r.text.length > 0);
  assert.match(r.text, /are you still interested\?/);
  assert.equal(r.hadQuote, false);

  const plain = messageToDisplayText("> just a quoted line\n> and another");
  assert.equal(plain.text, "> just a quoted line\n> and another");
  assert.equal(plain.hadQuote, false);
});

test("<script>, <style>, <head>, <title> and comments are removed with their content", () => {
  const body =
    "<html><head><title>Mail</title><style>.x{color:red}</style></head><body>" +
    "<!-- tracking --><script>alert('x')</script><div>Real words</div>" +
    "<style>div{margin:0}</style></body></html>";
  const r = messageToDisplayText(body);
  assert.equal(r.text, "Real words");
});

test("links keep their text, and add the URL only when it differs", () => {
  const r = messageToDisplayText(
    '<div>Book <a href="https://cal.example.com/sam">here</a> or visit ' +
      '<a href="https://example.com/">example.com</a> or mail <a href="mailto:sam@example.com">sam@example.com</a></div>',
  );
  assert.equal(
    r.text,
    "Book here (https://cal.example.com/sam) or visit example.com or mail sam@example.com",
  );
});

test("lists and tables get line breaks", () => {
  const r = messageToDisplayText(
    "<div>Options:<ul><li>One</li><li>Two</li></ul></div><table><tr><td>A</td><td>B</td></tr></table>",
  );
  assert.equal(r.text, "Options:\n• One\n• Two\nA B");
});

test("a block that opens mid-line starts a new line (Gmail mobile)", () => {
  const r = messageToDisplayText('<div dir="auto">Is Friday ok?<div dir="auto">I can do the morning.</div></div>');
  assert.equal(r.text, "Is Friday ok?\nI can do the morning.");
});

test("Outlook <p> lines with &nbsp; spacer paragraphs", () => {
  const r = messageToDisplayText(
    '<p class="MsoNormal">Hi there,</p>\r\n<p class="MsoNormal">&nbsp;</p>\r\n<p class="MsoNormal">Count me in.</p>',
  );
  assert.equal(r.text, "Hi there,\n\nCount me in.");
});

test("CRLF and lone CR become LF; trailing spaces trimmed", () => {
  const r = messageToDisplayText("Line one   \r\nLine two\r\rLine three \r\n\r\n\r\n\r\nEnd");
  assert.equal(r.text, "Line one\nLine two\n\nLine three\n\nEnd");
  assert.equal(originalForDisplay("a\r\nb\rc"), "a\nb\nc");
});

test("CRLF split around <br> (as stored by the poller) reads as one break per line", () => {
  const r = messageToDisplayText("<div>First line\r<br>\nSecond line\r<br>\nThird</div>");
  assert.equal(r.text, "First line\nSecond line\nThird");
});

test("plain text with angle-bracket addresses and links is not mistaken for HTML", () => {
  const body = "Thanks, Sam <sam@example.com>\nVisit our website<https://example.com/>\n[cid:image001.png@01DC]";
  assert.equal(looksLikeHtml(body), false);
  const r = messageToDisplayText(body);
  assert.equal(r.text, "Thanks, Sam <sam@example.com>\nVisit our website (https://example.com/)");
  assert.equal(r.hadQuote, false);
});

test("a stray '<' in HTML text survives; nothing is rendered as markup", () => {
  const r = messageToDisplayText("<div>Is 3 &lt; 5? a < b</div>");
  assert.equal(r.text, "Is 3 < 5? a < b");
});

test("null, empty and whitespace bodies", () => {
  assert.deepEqual(messageToDisplayText(null), { text: "", hadQuote: false });
  assert.deepEqual(messageToDisplayText("  \n \n "), { text: "", hadQuote: false });
});
