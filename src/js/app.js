(function () {
   'use strict';

   var LiveNowWidget = CoreLibrary.Component.subclass({
      defaultArgs: {
         listLimit: 1, // Set the list limit value to be used for pagination
         fallBackFilter: 'all/all/all/' // Set a fallback filter if we cant get the filter from the url
      },

      constructor () {
         CoreLibrary.Component.apply(this, arguments);
      },

      init () {
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

      startTimer () {
         this.timerCount = 0;
         this.updateTimers();
      },

      // frequency of the timer update in milliseconds
      timerTick: 1000,

      parseTime (secs, mins, running) {
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

      updateTimers () {
         this.timerCount++;
         this.scope.events.forEach((e) => {
            if (e.liveData == null || e.liveData.matchClock == null) {
               e.timer = null;
            } else {
               var matchClock = e.liveData.matchClock;
               e.timer = this.parseTime(matchClock.second, matchClock.minute, matchClock.running);
            }
         });

         clearTimeout(this.timer);
         this.timer = setTimeout (() => {
            this.updateTimers();
         }, this.timerTick);
      },

      getLiveEvents (params) {
         // For testing:
         // params = 'football/all/all/';
         // params = 'tennis/all/all';

         // Use filter to get events or get all live events.
         return CoreLibrary.offeringModule.getLiveEventsByFilter(params).then(( response ) => {
            clearTimeout(this.updateTimer);
            var previousPageNumber = null;
            if (this.pagination != null) {
               previousPageNumber = this.pagination.getCurrentPage();
            }
            if ( response.events != null ) {
               response.events.forEach((e) => {
                  if (e.betOffers != null && e.betOffers.length >= 1) {
                     e.betOffers = e.betOffers[0];
                     e.betOffers.outcomesLength = e.betOffers.outcomes.length;
                  }

                  e.navigateToLiveEvent = function (eventId) {
                     CoreLibrary.widgetModule.navigateToLiveEvent(eventId);
                  }.bind(this, e.event.id);

                  if (e.liveData && e.liveData.statistics &&
                        e.liveData.statistics.setBasedStats &&
                        e.liveData.statistics.setBasedStats.home.length) {
                     e.showScore = true;
                  } else {
                     e.showScore = false;
                  }
               });
               this.scope.events = response.events;
               // rivets does not allow you to track an Array length
               // see https://github.com/mikeric/rivets/issues/278
               this.scope.eventsLength = response.events.length;
            } else {
               this.scope.events = [];
               this.scope.eventsLength = 0;
            }

            // If there are outcomes in the betslip we need update our event outcomes with this.
            // Request the betslip outcomes.
            CoreLibrary.widgetModule.requestBetslipOutcomes();

            // Hide the widget if there are no live events to show
            if ( this.scope.events && this.scope.events.length > 0 ) {
               CoreLibrary.widgetModule.setWidgetHeight(this.scope.args.listLimit * 145 + 37 * 2);
            } else {
               CoreLibrary.widgetModule.setWidgetHeight(0);
            }

            if (previousPageNumber == null) {
               this.pagination = new CoreLibrary.PaginationComponent('#pagination', this.scope, 'events', this.scope.args.listLimit);
            } else {
               if (previousPageNumber >= this.scope.events.length) {
                  previousPageNumber = this.scope.events.length - 1;
               }
               this.pagination.setCurrentPage(previousPageNumber);
            }

            this.startTimer();

            this.updateTimer = setTimeout (() => {
               this.getLiveEvents (params);
            }, 30000);
         }).catch((e) => {
            // the timer resets even if there is an error
            this.updateTimer = setTimeout (() => {
               this.getLiveEvents (params);
            }, 30000);
            throw e;
         });
      }
   });

   var liveNowWidget = new LiveNowWidget({
      rootElement: 'html'
   });
})();
