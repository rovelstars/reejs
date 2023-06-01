export default function Island({children, on, name, ...props}) {
	return (
	  <div ISLAND_FILENAME __compName={name} island={on} {...props}>
		{children}
	  </div>
	);
}
