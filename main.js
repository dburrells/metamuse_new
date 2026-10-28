/* MetaMuse — site behaviour
   Configuration lives in config below. Fill in GA_ID (Google Analytics 4
   measurement ID, "G-XXXXXXXXXX") and FORM_ENDPOINT (waitlist form
   endpoint) once they exist. Leaving either empty disables that feature
   cleanly. */

(function () {
  "use strict";

  var config = {
    GA_ID: "G-TE1LMGXTCG",
    FORM_ENDPOINT: ""     // e.g. "https://formspree.io/f/xxxxxxxx"
  };

  var CONSENT_KEY = "mm-consent"; // "granted" | "denied"

  /* ---------- Navigation ---------- */
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.querySelector(".nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  /* ---------- Consent and analytics ---------- */
  function readConsent() {
    try { return localStorage.getItem(CONSENT_KEY); } catch (e) { return null; }
  }
  function writeConsent(value) {
    try { localStorage.setItem(CONSENT_KEY, value); } catch (e) { /* storage unavailable */ }
  }

  function loadAnalytics() {
    if (!config.GA_ID || window.__mmGaLoaded) { return; }
    window.__mmGaLoaded = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag("js", new Date());
    window.gtag("consent", "default", { analytics_storage: "granted", ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" });
    window.gtag("config", config.GA_ID, { anonymize_ip: true });
    var s = document.createElement("script");
    s.async = true;
    s.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(config.GA_ID);
    document.head.appendChild(s);
  }

  var banner = document.querySelector(".cookie");
  var consent = readConsent();

  if (consent === "granted") {
    loadAnalytics();
  } else if (consent !== "denied" && banner && config.GA_ID) {
    banner.classList.add("show");
  }

  if (banner) {
    var accept = banner.querySelector("[data-consent='accept']");
    var decline = banner.querySelector("[data-consent='decline']");
    if (accept) accept.addEventListener("click", function () { writeConsent("granted"); banner.classList.remove("show"); loadAnalytics(); });
    if (decline) decline.addEventListener("click", function () { writeConsent("denied"); banner.classList.remove("show"); });
  }

  // Privacy page: allow changing the choice later.
  document.querySelectorAll("[data-consent-reset]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      try { localStorage.removeItem(CONSENT_KEY); } catch (e) {}
      if (banner) banner.classList.add("show");
    });
  });

  /* ---------- Waitlist form ---------- */
  document.querySelectorAll("form.waitlist-form").forEach(function (form) {
    var status = form.querySelector(".form-status");
    var button = form.querySelector("button[type='submit']");

    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      var hp = form.querySelector("input[name='company_website']");
      if (hp && hp.value) { return; } // honeypot filled: ignore silently

      if (!config.FORM_ENDPOINT) {
        var email = form.querySelector("input[name='email']");
        var mailto = "mailto:me@davidburrells.co.uk?subject=" + encodeURIComponent("MetaMuse waitlist") +
          "&body=" + encodeURIComponent("Please add me to the MetaMuse waitlist.\n\nName: " +
          (form.querySelector("input[name='name']") || {}).value + "\nEmail: " + (email || {}).value +
          "\nOrganisation: " + (form.querySelector("input[name='organisation']") || {}).value +
          "\nInterest: " + (form.querySelector("select[name='interest']") || {}).value);
        window.location.href = mailto;
        if (status) { status.textContent = "Opening your email client. If nothing happens, email me@davidburrells.co.uk."; status.className = "form-status ok"; }
        return;
      }

      var data = new FormData(form);
      if (button) { button.disabled = true; button.textContent = "Joining…"; }
      if (status) { status.textContent = ""; status.className = "form-status"; }

      fetch(config.FORM_ENDPOINT, { method: "POST", body: data, headers: { "Accept": "application/json" } })
        .then(function (r) {
          if (!r.ok) { throw new Error("Request failed"); }
          form.reset();
          if (status) { status.textContent = "You're on the list. We'll be in touch."; status.className = "form-status ok"; }
          if (window.gtag) { window.gtag("event", "waitlist_joined"); }
        })
        .catch(function () {
          if (status) { status.textContent = "That didn't go through. Please try again, or email me@davidburrells.co.uk."; status.className = "form-status err"; }
        })
        .finally(function () {
          if (button) { button.disabled = false; button.textContent = "Join the waitlist"; }
        });
    });
  });

  /* ---------- Footer year ---------- */
  document.querySelectorAll("[data-year]").forEach(function (el) { el.textContent = String(new Date().getFullYear()); });
})();
