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
    }
},
...

### The widget accepts the following parameter/s:
1. `listLimit` - integer - defaults to 3 - list size per page
