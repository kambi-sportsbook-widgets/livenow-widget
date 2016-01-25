# livenow-widget

Live now widget displays a paginated list of live events with score and running time

## Configuration example:

__`client-widgets.js`__

```json

...
{
    "order": 1,
    "widgetId": "Live right now widget",
    "args": {
        "listLimit": 3
        "useFilter": false,
        "fallBackFilter": "all/all/all/"
    }
},
...

```

### The widget accepts the following parameter/s:
1. `listLimit` - integer - defaults to 3 - list size per page
2. `useFilter` - boolean - defaults to false - Whether to use a filter for getting the live events or fetch them all
3. `fallBackFilter` - string - defaults to "all/all/all/" - A filter to use if we can't get filter from page.

# Other tools

For setting up sass maps, follow this tutorial https://www.hackmonkey.com/2014/sep/configuring-css-source-maps-compass

To use Scss Lint, run "gem install scss_lint"

# Changelog

changelog can be found [here](CHANGELOG.md)
