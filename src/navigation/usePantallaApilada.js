import { useNavigationState } from '@react-navigation/native';

// true cuando la pantalla se abrió encima de otra de la pila (p. ej. la lista de Aves abierta desde
// Inicio): entonces la cabecera con flecha y migas es la de la pila y la pantalla no dibuja la suya.
// En su pestaña de origen (raíz de la pila) devuelve false y la pantalla se ve exactamente igual.
export default function usePantallaApilada() {
    return useNavigationState(estado => estado.index > 0);
}
