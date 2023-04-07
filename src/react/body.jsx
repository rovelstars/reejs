
export default function Body({children,className,style}) {
	return (
		<body className={className} style={style}>
		<div id="root" >
			{children}
		</div>
		</body>
	)
}
