test:
	cd test; ../node_modules/.bin/mocha *.js -t 10000 --reporter spec --globals NODE_CONFIG

.PHONY:	test
