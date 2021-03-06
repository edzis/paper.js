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
	_contrast: 1.5,
	_needsColorization: false,
	_colorSettings: {
		sourceGray: 128,
		resultScale: 0.83,
		resultOffset: 12
	},

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
		if(image.width === 0)
			return;

		if (this._canvas) {
			CanvasProvider.release(this._canvas);
			this._canvas = null;
		}

/*#*/ if (options.browser) {
		this._size = Size.create(image.naturalWidth, image.naturalHeight);
/*#*/ } else if (options.server) {
		this._size = Size.create(image.width, image.height);
/*#*/ } // options.server

		this._image = image;
		this._canvas = this.getCanvas();
		this._image = null;

		this._sourceImageData = this.getImageData();
		this._needsColorization = true;
		this._changed(/*#=*/ Change.GEOMETRY | /*#=*/ Change.PIXELS);
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
* Modified version of Raster._hitTest() - checks early on if alpha is greater than 0
*/
	_hitTest: function(point, options) {
		if (point.isInside(this._getBounds())) {
			var offset = point.add(this._size.divide(2)).round();
			var pixel = this.getPixel(offset);

			if (pixel.alpha > 0) {
				return new HitResult('pixel', this, {
					offset: offset,
					// Inject as Bootstrap accessor, so #toString renders well too
					color: {
						get: function() {
							return pixel;
						}
					}
				});
			}
		}
	},

/**
* Colorize at the last moment possible - just before drawing
**/
	draw: function(ctx, param) {
		if (this._needsColorization) {
			this._colorize();
		}

		this.base(ctx, param)
	},



	getColor: function() {
		return this._color;
	},


	setColor: function() {
		var color = Color.read(arguments);

		if (color) {
			if (!color.equals(this._color)) {
				this._color = color;
				this._needsColorization = true;
			}
		}
	},

	getContrast: function() {
		return this._contrast;
	},

	setContrast: function(contrast) {
		if (contrast !== this._contrast) {
			this._contrast = contrast;
			this._needsColorization = true;
		}
	},

/**
* Colorize the grayscaled source image using a given color and a sclae factor to determine the intensity od hilights and shadows
*/
	_colorize: function() {
		this._needsColorization = false;

		if (this._sourceImageData && this._color) {
			// var resultData = this.getImageData(this.getSize());
			var resultData = this._context.getImageData(0,0, this._size.width, this._size.height);
			var scale =  this._contrast;
			var r = this._color.getRed()*0xFF;
			var g = this._color.getGreen()*0xFF;
			var b = this._color.getBlue()*0xFF;
			var scaledGrayOffset = this._colorSettings.sourceGray * scale;
			var resultScale = this._colorSettings.resultScale;
			var resultOffset = this._colorSettings.resultOffset;
			
			console.log(scale)

			for (i = 0, l = this._sourceImageData.data.length; i < l; i+=4) {
				sourceColor = this._sourceImageData.data[i];

				resultData.data[i]     = (sourceColor * scale - scaledGrayOffset + r) * resultScale + resultOffset; // red
				resultData.data[i + 1] = (sourceColor * scale - scaledGrayOffset + g) * resultScale + resultOffset; // green
				resultData.data[i + 2] = (sourceColor * scale - scaledGrayOffset + b) * resultScale + resultOffset; // blue
			}

			this._context.putImageData(resultData, 0, 0);
		}
	}
});
