// Платформа Google Play (сборка build\make-gplay.mjs → publish\gplay\app\). Подключается вместо SDK Яндекса.
// Игра работает через свой слой PF так же, как на Яндексе: PF вызывает YaGames.init(), getPlayer(), adv.* — здесь это адаптер.
// Сейчас: рекламы нет, покупок (Премиума) нет, облака нет — прогресс хранится на устройстве (localStorage).
//
// ОДНО МЕСТО ДЛЯ ПОДКЛЮЧЕНИЯ AdMob / Google Play Billing — объект GP_ADAPTER ниже:
//   interstitial(cb)  — показать полноэкранную рекламу; cb() ровно один раз, когда игра может продолжать;
//   rewarded(cb)      — показать ролик за награду; cb(true) только если игрок досмотрел;
//   enabled           — true, когда реклама подключена (тогда в игре появятся кнопки «Посмотреть рекламу»).
// Интервалы (не раньше 2 мин после запуска, не чаще раза в 5 мин), пауза игры на время рекламы — уже в игре (слой PF).
(function () {
  'use strict';
  var GP_ADAPTER = window.GP_ADAPTER = {
    enabled: false,
    interstitial: function (cb) { cb(); },
    rewarded: function (cb) { cb(false); }
  };
  window.YaGames = {
    init: function () {
      return Promise.resolve({
        environment: { i18n: { lang: '' } },   // язык — по navigator.language (в игре), плюс переключатель RU/EN
        features: {}, on: function () {},
        // реклама — только если адаптер включён; формат вызовов — как у SDK Яндекса, который ждёт слой PF
        get adv() {
          if (!GP_ADAPTER.enabled) return null;
          return {
            showFullscreenAdv: function (o) {
              var c = (o && o.callbacks) || {}; try { c.onOpen && c.onOpen(); } catch (e) {}
              GP_ADAPTER.interstitial(function () { try { c.onClose && c.onClose(true); } catch (e) {} });
            },
            showRewardedVideo: function (o) {
              var c = (o && o.callbacks) || {}; try { c.onOpen && c.onOpen(); } catch (e) {}
              GP_ADAPTER.rewarded(function (ok) { try { if (ok && c.onRewarded) c.onRewarded(); c.onClose && c.onClose(); } catch (e) {} });
            }
          };
        },
        // облака нет: PF сохраняет только на устройстве
        getPlayer: function () { return Promise.reject(new Error('Google Play: облако не подключено, сохранение на устройстве')); }
      });
    }
  };
  // офлайн: кэш всех файлов игры
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    window.addEventListener('load', function () { navigator.serviceWorker.register('sw.js').catch(function () {}); });
  }
})();
