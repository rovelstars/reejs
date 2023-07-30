//The App component for Reejs. This is the main component for any Reejs website.
//It is responsible for rendering the header, footer, and the main content of the website.
//This file should pull packages from the project's import maps during packit build so thats why its not using packages in package.json
import Header from './header.jsx';
import Body from './body.jsx';
export default function App({ children, className, style, metadata }) {

	return (
		<html lang={metadata?.lang || "en"}>
			<Header data={metadata} />
			<Body children={children} className={className} style={style} />
			<script id="__reejs" />
		</html>
	)
}
