export const ecosystemConnections = [
  { from: "Radar de red contextual", fromType: "Lab", to: "WiFi Monitor", toType: "Project", why: "La identidad persistente, presencia e historial dejaron de ser una prueba aislada y se convirtieron en la base para entender cambios dentro de una red.", href: "/central/projects#wifi-monitor", icon: "radio" },
  { from: "Acceso privado por dispositivo", fromType: "Lab", to: "BR Remote Terminal", toType: "Project relacionado", why: "Las pruebas con red privada y autorización del dispositivo alimentan una consola que sigue en validación y debe permanecer privada.", href: "/central/projects#remote-terminal", icon: "key" },
  { from: "BR Platform", fromType: "Project", to: "BR Solutions", toType: "Producto activo", why: "Los flujos de catálogo, acceso y experiencia musical ya tienen suficiente forma para evaluarse como una capacidad repetible.", href: "/central/solutions#br-platform", icon: "sparkles" },
  { from: "BRTuNegocio / ALUXOR", fromType: "Project", to: "BR Solutions", toType: "Candidato", why: "Su arquitectura modular puede resolver operación más allá del caso original, pero todavía debe separar con claridad producto estándar y configuración por negocio.", href: "/central/solutions#aluxor", icon: "boxes" },
] as const;

export const ecosystemSharedPrinciples = [
  { title: "Contexto antes que pantalla", text: "Central, Companion y los sistemas operativos comparten una idea: una interfaz vale más cuando explica qué está pasando y por qué." },
  { title: "Identidad antes que dirección", text: "En infraestructura aprendimos a no confundir una IP con un dispositivo. Ese mismo principio sirve para pensar usuarios, proyectos y recursos persistentes." },
  { title: "Autorización por capas", text: "Las herramientas privadas separan transporte, sesión, dispositivo y autorización. Una sola barrera visual no se trata como seguridad completa." },
  { title: "Historia antes que estado", text: "Recepciones, redes y proyectos ganan valor cuando conservan cómo llegaron al estado actual, no solo el último valor visible." },
] as const;
