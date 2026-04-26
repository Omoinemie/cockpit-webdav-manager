// i18n module — loads language JSON via relative fetch
var I18n = (function() {

  var _currentLang = 'en';
  var _dict = {};
  var _cache = {};

  function load(lang) {
    _currentLang = lang || _currentLang;
    localStorage.setItem('lang', _currentLang);

    if (_cache[_currentLang]) {
      _dict = _cache[_currentLang];
      return Promise.resolve(_dict);
    }

    var url = 'lang/' + _currentLang + '.json';

    return fetch(url)
      .then(function(r) {
        if (!r.ok) throw new Error(r.status);
        return r.json();
      })
      .then(function(data) {
        _cache[_currentLang] = data;
        _dict = data;
        return _dict;
      })
      .catch(function(err) {
        console.error('[i18n] load error:', err);
        if (_currentLang !== 'en') {
          _currentLang = 'en';
          return load('en');
        }
        _dict = {};
        return _dict;
      });
  }

  function t(key) {
    return _dict[key] || key;
  }

  function applyToDOM() {
    document.querySelectorAll('[data-i18n]').forEach(function(el) {
      el.textContent = t(el.getAttribute('data-i18n'));
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(function(el) {
      el.placeholder = t(el.getAttribute('data-i18n-placeholder'));
    });
    document.querySelectorAll('[data-i18n-title]').forEach(function(el) {
      el.title = t(el.getAttribute('data-i18n-title'));
    });
  }

  function switchLang(lang) {
    return load(lang).then(function() {
      applyToDOM();
      document.documentElement.lang = lang;
    });
  }

  function getLang() {
    return _currentLang;
  }

  return {
    load: load,
    t: t,
    applyToDOM: applyToDOM,
    switchLang: switchLang,
    getLang: getLang,
    ready: function() { return Object.keys(_dict).length > 0; }
  };
})();
