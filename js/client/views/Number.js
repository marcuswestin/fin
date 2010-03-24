jsio('from shared.javascript import Class, bind')
jsio('import .Input as Input')

exports = Class(Input, function(supr){
	
	this._expectedType = 'number'
	
	this._mutateItem = function(mutation) {
		setTimeout(bind(this, function() {
			var numberMutation = { property: mutation.property }
			numberMutation.value = parseInt(this._element.value) || 0
			this._getItem().mutate(numberMutation)
		}))
	}
})