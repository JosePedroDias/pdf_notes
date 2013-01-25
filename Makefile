min:
	@uglifyjs pdf.js > pdf.min.js



# REMOVED log()
# changed verbosity to ERRORS
# fixed https://github.com/mozilla/pdf.js/issues/2209
update:
	@rm pdf.js
	@wget https://raw.github.com/mozilla/pdf.js/gh-pages/build/pdf.js
