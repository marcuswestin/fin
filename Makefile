
.PHONY: install clean

install:
	git clone git://github.com/marcuswestin/js.io.git
	ln -s ../js.io js/jsio

clean:
	rm -rf js.io
	rm js/jsio