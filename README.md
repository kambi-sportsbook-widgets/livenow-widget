# livenow-widget

![](https://github.com/kambi-sportsbook-widgets/livenow-widget/blob/master/screenshot.png?raw=true)

Live now widget displays a paginated list of live events with score and running time. The widget is "context-aware" in the sense that if placed inside an area of the sportsbook (for example the World Cup Qualifiers page) it will show the events pertaining only that area (the World Cup Qualifiers matches).

This is a C-widget that means that it is not provided by Kambi directly, instead the operators that want to use this need to build and host the widget themselves. Please see Build Instructions.

## Configuration

Arguments and default values:
```json
"args": {
    "listLimit": 1,
    "fallBackFilter": "all/all/all/"
}
```

1. `listLimit` - integer - list size per page
2. `fallBackFilter` - string - A filter to use if we can't get filter from page. That means this value is NOT used when `pageInfo.pageType` is `"filter"`, in this case the widget will use `pageInfo.pageParam` as the filter.

### Build Instructions

Please refer to the [core-library](https://github.com/kambi-sportsbook-widgets/widget-core-library)
