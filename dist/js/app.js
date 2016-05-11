'use strict';

(function () {
   'use strict';

   var LiveNowWidget = CoreLibrary.Component.subclass({
      defaultArgs: {
         listLimit: 1, // Set the list limit value to be used for pagination
         fallBackFilter: 'all/all/all/' // Set a fallback filter if we cant get the filter from the url
      },

      constructor: function constructor() {
         CoreLibrary.Component.apply(this, arguments);
      },
      init: function init() {
         // The live events grabbed from the api
         this.scope.events = [];

         // timer for updating the running times of the live matches
         this.timer = null;

         // timer to update the matches themselves
         this.updateTimer = null;

         // Set filter parameters
         var params;
         if (CoreLibrary.pageInfo.pageType === 'filter') {
            params = CoreLibrary.pageInfo.pageParam;
         } else {
            params = this.scope.args.fallBackFilter;
         }
         // Fetch the live events
         this.getLiveEvents(params);
      },
      startTimer: function startTimer() {
         this.timerCount = 0;
         this.updateTimers();
      },


      // frequency of the timer update in milliseconds
      timerTick: 1000,

      parseTime: function parseTime(secs, mins, running) {
         var secs = parseInt(secs, 10);
         var mins = parseInt(mins, 10);
         if (running) {
            var elapsedSeconds = this.timerTick * this.timerCount / 1000;
            var eventSeconds = mins * 60 + secs + elapsedSeconds;

            mins = String(Math.floor(eventSeconds / 60));
            secs = String(Math.floor(eventSeconds % 60));
         }
         if (mins.length === 1) {
            mins = '0' + mins;
         }
         if (secs.length === 1) {
            secs = '0' + secs;
         }
         return mins + ' : ' + secs;
      },
      updateTimers: function updateTimers() {
         var _this = this;

         this.timerCount++;
         this.scope.events.forEach(function (e) {
            if (e.liveData == null || e.liveData.matchClock == null) {
               e.timer = null;
            } else {
               var matchClock = e.liveData.matchClock;
               e.timer = _this.parseTime(matchClock.second, matchClock.minute, matchClock.running);
            }
         });

         clearTimeout(this.timer);
         this.timer = setTimeout(function () {
            _this.updateTimers();
         }, this.timerTick);
      },
      getLiveEvents: function getLiveEvents(params) {
         var _this2 = this;

         params = 'football/all/all/';
         // Use filter to get events or get all live events.
         return CoreLibrary.offeringModule.getLiveEventsByFilter(params).then(function (response) {
            clearTimeout(_this2.updateTimer);
            if (response.events != null) {
               response.events.forEach(function (e) {
                  if (e.betOffers != null && e.betOffers.length >= 1) {
                     e.betOffers = e.betOffers[0];
                     e.betOffers.outcomesLength = e.betOffers.outcomes.length;
                  }

                  e.navigateToLiveEvent = function (eventId) {
                     CoreLibrary.widgetModule.navigateToLiveEvent(eventId);
                  }.bind(_this2, e.event.id);

                  if (e.liveData && e.liveData.statistics && e.liveData.statistics.setBasedStats && e.liveData.statistics.setBasedStats.home.length) {
                     e.showScore = true;
                  } else {
                     e.showScore = false;
                  }
               });
               _this2.scope.events = response.events;
               // rivets does not allow you to track an Array length
               // see https://github.com/mikeric/rivets/issues/278
               _this2.scope.eventsLength = response.events.length;
            } else {
               _this2.scope.events = [];
               _this2.scope.eventsLength = 0;
            }

            // If there are outcomes in the betslip we need update our event outcomes with this.
            // Request the betslip outcomes.
            CoreLibrary.widgetModule.requestBetslipOutcomes();

            // Hide the widget if there are no live events to show
            if (_this2.scope.events && _this2.scope.events.length > 0) {
               CoreLibrary.widgetModule.setWidgetHeight(_this2.scope.args.listLimit * 145 + 37 * 2);
            } else {
               CoreLibrary.widgetModule.setWidgetHeight(0);
            }

            _this2.pagination = new CoreLibrary.PaginationComponent('#pagination', _this2.scope, 'events', _this2.scope.args.listLimit);

            _this2.startTimer();

            _this2.updateTimer = setTimeout(function () {
               // TODO prevent animation when updating and keep current page open
               _this2.getLiveEvents(params);
            }, 30000);
         }).catch(function (e) {
            // the timer resets even if there is an error
            _this2.updateTimer = setTimeout(function () {
               _this2.getLiveEvents(params);
            }, 30000);
            throw e;
         });
      }
   });

   var liveNowWidget = new LiveNowWidget({
      rootElement: 'html'
   });
})();
//# sourceMappingURL=app.js.map
