export default function Header({ children, data }) {
  //data is an object with the same properties in nextjs v13 metadata feature
  //data is optional
  let generated = [];
  if (data) {
    //title
    if (data.title) {
      generated.push(<title key="title">{data.title}</title>);
    }
    //description
    if (data.description) {
      generated.push(
        <meta key="description" name="description" content={data.description} />
      );
    }
    // generator,  applicationName  referrer  keywords: ['Next.js', 'React', 'JavaScript'],  authors: [{ name: 'Seb' }, { name: 'Josh', url: 'https://nextjs.org' }],  colorScheme: 'dark',  creator: 'Jiachi Liu',  publisher: 'Sebastian Markbåge',  formatDetection: {    email: false,    address: false,    telephone: false,  },

    if (data.generator) {
      generated.push(
        <meta key="generator" name="generator" content={data.generator} />
      );
    }
    if (data.metas) {
      data.metas.forEach(meta => {
        generated.push(
          <meta key={meta.name} name={meta.name} content={meta.content} />
        );
      });
    }
    if (data.applicationName) {
      generated.push(
        <meta
          key="application-name"
          name="application-name"
          content={data.applicationName}
        />
      );
    }
    if (data.referrer) {
      generated.push(
        <meta key="referrer" name="referrer" content={data.referrer} />
      );
    }
    if (data.keywords) {
      generated.push(
        <meta
          key="keywords"
          name="keywords"
          content={data.keywords.join(", ")}
        />
      );
    }
    if (data.authors) {
      for (const author of data.authors) {
        generated.push(
          <meta
            key={`author-${author.name}`}
            name="author"
            content={author.name}
          />
        );
        if (author.url) {
          generated.push(
            <meta
              key={`author-${author.name}-url`}
              name="author"
              content={author.url}
            />
          );
        }
      }
    }
    if (data.colorScheme) {
      generated.push(
        <meta
          key="color-scheme"
          name="color-scheme"
          content={data.colorScheme}
        />
      );
    }
    if (data.creator) {
      generated.push(
        <meta key="creator" name="creator" content={data.creator} />
      );
    }
    if (data.publisher) {
      generated.push(
        <meta key="publisher" name="publisher" content={data.publisher} />
      );
    }
    if (data.formatDetection) {
      //should join them, change false to no, true to yes
      let content = [];
      data.formatDetection.email === false
        ? content.push("no")
        : data.formatDetection.email === true
          ? content.push("yes")
          : null;
      data.formatDetection.address === false
        ? content.push("no")
        : data.formatDetection.address === true
          ? content.push("yes")
          : null;
      data.formatDetection.telephone === false
        ? content.push("no")
        : data.formatDetection.telephone === true
          ? content.push("yes")
          : null;
    }
    if (data.alternates) {
      if (data.alternates.canonical) {
        generated.push(
          <link
            rel="canonical"
            key="canonical"
            href={new URL(
              data.alternates.canonical,
              data.metadataBase
            ).toString()}
          />
        );
      }
      if (data.alternates.languages) {
        for (const [key, value] of Object.entries(data.alternates.languages)) {
          generated.push(
            <link
              rel="alternate"
              key={`alternate-${key}`}
              href={new URL(value, data.metadataBase).toString()}
              hrefLang={key}
            />
          );
        }
      }
    }
    if (data.openGraph) {
      if (data.openGraph.title) {
        generated.push(
          <meta
            key="og:title"
            property="og:title"
            content={data.openGraph.title}
          />
        );
      }
      if (data.openGraph.description) {
        generated.push(
          <meta
            key="og:description"
            property="og:description"
            content={data.openGraph.description}
          />
        );
      }
      if (data.openGraph.url) {
        generated.push(
          <meta key="og:url" property="og:url" content={data.openGraph.url} />
        );
      }
      if (data.openGraph.siteName) {
        generated.push(
          <meta
            key="og:site_name"
            property="og:site_name"
            content={data.openGraph.siteName}
          />
        );
      }
      if (data.openGraph.images) {
        for (const image of data.openGraph.images) {
          generated.push(
            <meta
              key={`og:image-${image.url}`}
              property="og:image"
              content={image.url}
            />
          );
          if (image.width) {
            generated.push(
              <meta
                key={`og:image-width-${image.url}`}
                property="og:image:width"
                content={image.width}
              />
            );
          }
          if (image.height) {
            generated.push(
              <meta
                key={`og:image-height-${image.url}`}
                property="og:image:height"
                content={image.height}
              />
            );
          }
          if (image.alt) {
            generated.push(
              <meta
                key={`og:image-alt-${image.url}`}
                property="og:image:alt"
                content={image.alt}
              />
            );
          }
        }
      }
      if (data.openGraph.locale) {
        generated.push(
          <meta
            key="og:locale"
            property="og:locale"
            content={data.openGraph.locale}
          />
        );
      }
      if (data.openGraph.type) {
        generated.push(
          <meta
            key="og:type"
            property="og:type"
            content={data.openGraph.type}
          />
        );
      }
      if (data.openGraph.themeColor) {
        if (typeof data.openGraph.themeColor == "string")
          generated.push(
            <meta
              key="theme-color"
              name="theme-color"
              content={data.openGraph.themeColor}
            />
          );
        else {
          if (data.openGraph.themeColor.light)
            generated.push(
              <meta
                key="theme-color-light"
                name="theme-color"
                content={data.openGraph.themeColor.light}
                media="(prefers-color-scheme: light)"
              />
            );
          if (data.openGraph.themeColor.dark)
            generated.push(
              <meta
                key="theme-color-dark"
                name="theme-color"
                content={data.openGraph.themeColor.dark}
                media="(prefers-color-scheme: dark)"
              />
            );
        }
      }
    }
    if (data.stylesheets) {
      for (const stylesheet of data.stylesheets) {
        generated.push(
          <link
            rel="stylesheet"
            key={`stylesheet-${stylesheet}`}
            href={stylesheet}
          />
        );
      }
    }
    if (data.icon) {
      generated.push(
        <link rel="icon" key={`icon-${data.icon}`} href={data.icon} />
      );
    }
    if (data.robots) {
      //filter out objects from robots. theyre specific bots
      const robots = Object.fromEntries(
        Object.entries(data.robots).filter(
          ([key, value]) => typeof value !== "object"
        )
      );

      //get all the bots
      const bots = Object.fromEntries(
        Object.entries(data.robots).filter(
          ([key, value]) => typeof value === "object"
        )
      );
      let generateRobotContent = obj => {
        let content = [];
        for (const [key, value] of Object.entries(obj)) {
          value === true
            ? content.push(key)
            : value === false
              ? content.push(`no${key}`)
              : content.push(`${key}:${value}`);
        }
        return content.join(", ");
      };
      //add the robots
      for (const [key, value] of Object.entries(bots)) {
        generated.push(
          <meta
            key={`robots-${key}`}
            name={`${key.toLowerCase()}`}
            content={generateRobotContent(value)}
          />
        );
      }
      //add the default bots value
      generated.push(
        <meta
          key={`robots`}
          name={`robots`}
          content={generateRobotContent(robots)}
        />
      );
    }
  }
  //remove duplicates by key
  const uniqueGenerated = generated.filter(
    (v, i, a) => a.findIndex(t => t.key === v.key) === i
  );

  return (
    <head>
      <meta charSet="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      {children || ""}
      {uniqueGenerated || ""}
    </head>
  );
}
