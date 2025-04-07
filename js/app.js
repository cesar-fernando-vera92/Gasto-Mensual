let cantidadPresupuesto;
let miFormulario = document.getElementById("formulario");
const formulario = document.getElementById('agregar-gasto');

// Clases
class Presupuesto {
    constructor(presupuesto) {
        this.presupuesto = Number(presupuesto);
        this.restante = Number(presupuesto);
    }
    
    presupuestoRestante(cantidad = 0) {
        return (this.restante -= Number(cantidad));
    }
}

class Interfaz {
    insertarPresupuesto(cantidad) {
        const presupuestoSpan = document.querySelector('span#total');
        const restanteSpan = document.querySelector('span#restante');

        presupuestoSpan.innerHTML = `${cantidad}`;
        restanteSpan.innerHTML = `${cantidad}`;
        
        // Guardar en Local Storage
        localStorage.setItem('presupuestoInicial', cantidad);
        localStorage.setItem('presupuestoRestante', cantidad);
    }
    
    imprimirMensaje(mensaje, tipo) {
        const divMensaje = document.createElement('div');
        divMensaje.classList.add('text-center', 'alert');
        if (tipo === 'error') {
            divMensaje.classList.add('alert-danger');
        } else {
            divMensaje.classList.add('alert-success');
        }
        divMensaje.appendChild(document.createTextNode(mensaje));

        document.querySelector('.primario').insertBefore(divMensaje, formulario);

        setTimeout(function() {
            document.querySelector('.primario .alert').remove();
            formulario.reset();
        }, 3000);
    }
    
    agregarGastoListado(nombre, cantidad) {
        const gastosListado = document.querySelector('#gastos ul');
        const li = document.createElement('li');
        li.className = 'list-group-item d-flex justify-content-between align-items-center';
        li.innerHTML = `
            ${nombre}
            <span class="badge badge-primary badge-pill"> $ ${cantidad} </span>
        `;
        gastosListado.appendChild(li);
    }

    presupuestoRestante(cantidad) {
        const restante = document.querySelector('span#restante');
        const presupuestoRestanteUsuario = cantidadPresupuesto.presupuestoRestante(cantidad);
        restante.innerHTML = `${presupuestoRestanteUsuario}`;
        
        // Actualizar Local Storage
        localStorage.setItem('presupuestoRestante', presupuestoRestanteUsuario);
        
        this.comprobarPresupuesto();
    }

    comprobarPresupuesto() {
        const presupuestoTotal = cantidadPresupuesto.presupuesto;
        const presupuestoRestante = cantidadPresupuesto.restante;

        if (presupuestoTotal / 4 > presupuestoRestante) {
            const restante = document.querySelector('.restante');
            restante.classList.remove('alert-success', 'alert-warning');
            restante.classList.add('alert-danger');
        } else if (presupuestoTotal / 2 > presupuestoRestante) {
            const restante = document.querySelector('.restante');
            restante.classList.remove('alert-success');
            restante.classList.add('alert-warning');
        }
    }
}

// Evento para añadir presupuesto
miFormulario.addEventListener("submit", validarFormulario);
function validarFormulario(e) {
    e.preventDefault();
    let formulario = e.target;

    $("#formulario").hide();

    const presupuestoUsuario = formulario.children[1].value;

    if (presupuestoUsuario === null || presupuestoUsuario === '') {
        window.location.reload();
    } else {
        cantidadPresupuesto = new Presupuesto(presupuestoUsuario);
        const ui = new Interfaz();
        ui.insertarPresupuesto(cantidadPresupuesto.presupuesto);
        
        // Cargar gastos existentes al establecer nuevo presupuesto
        cargarGastosGuardados();
    }
}

// Evento para agregar gastos
formulario.addEventListener('submit', function(e) {
    e.preventDefault();

    const nombreGasto = document.querySelector('#gasto').value;
    const cantidadGasto = document.querySelector('#cantidad').value;

    const ui = new Interfaz();
    
    if (nombreGasto === '' || cantidadGasto === '') {
        ui.imprimirMensaje('Campo Vacio', 'error');
    } else {
        // Crear objeto con el gasto
        const gasto = {
            nombre: nombreGasto,
            cantidad: cantidadGasto
        };

        // Añadir a Local Storage
        agregarGastoLocalStorage(gasto);

        // Insertar en el HTML
        ui.imprimirMensaje('Correcto', 'correcto');
        ui.agregarGastoListado(nombreGasto, cantidadGasto);
        ui.presupuestoRestante(cantidadGasto);
    }
});

// Funciones para Local Storage
function agregarGastoLocalStorage(gasto) {
    let gastos = obtenerGastosLocalStorage();
    gastos.push(gasto);
    localStorage.setItem('gastos', JSON.stringify(gastos));
}

function obtenerGastosLocalStorage() {
    return localStorage.getItem('gastos') === null ? 
        [] : JSON.parse(localStorage.getItem('gastos'));
}

function cargarGastosGuardados() {
    const gastos = obtenerGastosLocalStorage();
    const ui = new Interfaz();
    
    gastos.forEach(function(gasto) {
        ui.agregarGastoListado(gasto.nombre, gasto.cantidad);
        
        // Actualizar el presupuesto restante sin cambiar la UI (ya que se hace en presupuestoRestante)
        cantidadPresupuesto.presupuestoRestante(gasto.cantidad);
    });
    
    // Actualizar el display del presupuesto restante
    const restante = document.querySelector('span#restante');
    restante.innerHTML = `${cantidadPresupuesto.restante}`;
    ui.comprobarPresupuesto();
}

// Al cargar la página, verificar si hay presupuesto guardado
document.addEventListener('DOMContentLoaded', function() {
    const presupuestoInicial = localStorage.getItem('presupuestoInicial');
    
    if (presupuestoInicial) {
        $("#formulario").hide();
        cantidadPresupuesto = new Presupuesto(presupuestoInicial);
        const ui = new Interfaz();
        ui.insertarPresupuesto(cantidadPresupuesto.presupuesto);
        
        // Establecer el restante desde Local Storage
        const restanteGuardado = localStorage.getItem('presupuestoRestante');
        if (restanteGuardado) {
            cantidadPresupuesto.restante = Number(restanteGuardado);
            document.querySelector('span#restante').innerHTML = `${restanteGuardado}`;
        }
        
        cargarGastosGuardados();
    }
});

// Función para reiniciar la aplicación (opcional)
function reiniciarApp() {
    localStorage.removeItem('presupuestoInicial');
    localStorage.removeItem('presupuestoRestante');
    localStorage.removeItem('gastos');
    window.location.reload();
				      }
