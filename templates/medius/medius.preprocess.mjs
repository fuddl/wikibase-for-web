export default ({ vars, context, instance }) => {
	const fileName = encodeURIComponent(vars.datavalue.value);
	const mediaPrefix = {
		localMedia: `${instance.wikiRoot}/index.php?title=Special:Redirect/file/`,
		commonsMedia:
			'https://commons.wikimedia.org/w/index.php?title=Special:FilePath/',
	};
	const hrefPrefix = {
		localMedia: instance.wikiRoot,
		commonsMedia: 'https://commons.wikimedia.org/wiki',
	};
	const srcUrl = `${mediaPrefix[vars.datatype]}${fileName}`;
	vars.href = `${hrefPrefix[vars.datatype]}/File:${fileName}`;

	if (fileName.match(/\.svg$/i)) {
		vars.image = {
			src: srcUrl,
			scaleable: true,
		};
	} else if (fileName.match(/\.(jpe?g|png|gif|tiff?|stl)$/i)) {
		vars.image = {
			src: srcUrl,
			sources: [
				{
					srcSet: [250, 501, 801, 1068]
						.map(width => {
							return `${srcUrl}&width=${width}px ${width}w`;
						})
						.join(', '),
				},
			],
		};
	} else if (fileName.match(/\.(flac|wav|og[ga])$/i)) {
		vars.audio = {
			src: srcUrl,
		};
	} else if (fileName.match(/\.webm$/i)) {
		vars.video = {
			src: srcUrl,
			poster: `${srcUrl}&width=501px`,
		};
	}
	vars.media_info = browser.i18n.getMessage('media_info');
};
