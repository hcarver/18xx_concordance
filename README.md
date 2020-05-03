# 18XX Concordance

This is a project based on the 18XX rules list
[maintained by Keith Thomasson](http://www.fwtwr.com/18xx/rules_difference_list/single_list.htm).

This project is intended to not replicate any data on that page at all. That page is a datasource (a local cache is
kept in this repository). It's then parsed to make a data.json file containing a list of games, and sets of rules.
That file is then used to present the data on the page.

### Run it

```
yarn install
yarn start
# Generate the data.json file
cd src
node datasource.js
```

### Notes

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).
