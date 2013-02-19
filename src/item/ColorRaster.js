/*
 * @author Edgar Simson, edgar@orangelv.com
 */

/**
 * @name ColorRaster
 *
 * @class The ColorRaster item represents a colorizable image in a Paper.js project.
 *
 * @extends Raster
 */
var ColorRaster = this.ColorRaster = Raster.extend(/** @lends Raster# */{
	_sourceImageData: null,
	_color: null,
	_colorScale: 1.0,
	_needsColorization: false,

	initialize: function(object, point) {
		this.base(object, point);
	},


	setCanvas: function(canvas) {
		this.base(canvas);
		if(this._canvas !== null) {
			this._sourceImageData = this.getImageData();
			this._needsColorization = true;
		}
	},

/**
 * Whenever there is an _image, it must be taken into a canvas - colorization is only available in canvas
 */
	setImage: function(image) {
		this.base(image);
		if(this._image !== null && !this._size.isZero()) {
			var canvas = this.getCanvas();
			this._image = null;
			this.setCanvas(canvas);
		}
	},

/**
* Do not call the default method to prevent rendering now - will need to render at draw -> colorize anyways
*/
	setImageData: function(data, point) {
		this._sourceImageData = data;
		this._needsColorization = true;
		this._changed(/*#=*/ Change.GEOMETRY | /*#=*/ Change.PIXELS);
	},

/**
* Colorize at the last moment possible - just before drawing
**/
	draw: function(ctx, param) {
		if(this._needsColorization) {
			this._colorize();
		}
		this.base(ctx, param)
	},



	getColor: function() {
		return this._color;
	},

	setColor: function() {
		var color = Color.read(arguments);
		if (!color.equals(this._color)) {
			this._color = color;
			this._needsColorization = true;
		}
	},

	getColorScale: function() {
		return this._colorScale;
	},

	setColorScale: function(colorScale) {
		if (colorScale !== this._colorScale) {
			this._colorScale = colorScale;
			this._needsColorization = true;
		}
	},

/**
* Colorize the grayscaled source image using a given color and a sclae factor to determine the intensity od hilights and shadows
*/
	_colorize: function() {
		this._needsColorization = false;
		if(this._sourceImageData && this._color) {
			// var resultData = this.getImageData(this.getSize());
			var resultData = this._context.getImageData(0,0, this._size.width, this._size.height);
			var scale =  this._colorScale;
			var r = this._color.getRed()*0xFF;
			var g = this._color.getGreen()*0xFF;
			var b = this._color.getBlue()*0xFF;
			var scaledGrayOffset = 128 * scale;

			for (i = 0, l = this._sourceImageData.data.length; i < l; i+=4) {
				sourceColor = this._sourceImageData.data[i];
				resultData.data[i]		= sourceColor * scale - scaledGrayOffset + r; // red
				resultData.data[i + 1]	= sourceColor * scale - scaledGrayOffset + g; // green
				resultData.data[i + 2]	= sourceColor * scale - scaledGrayOffset + b; // blue
			}

			this._context.putImageData(resultData, 0, 0);
		}
	}
});
