// Clases principales
class Presupuesto {
    constructor(presupuesto) {
        this.presupuesto = Number(presupuesto);
        this.restante = Number(presupuesto);
        this.gastos = [];
    }

    agregarGasto(gasto) {
        this.gastos.push(gasto);
        this.restante -= gasto.monto;
    }

    eliminarGasto(id) {
        const gastoEliminado = this.gastos.find(gasto => gasto.id === id);
        if (!gastoEliminado) return;
        // Actualizar el restante
        this.restante += gastoEliminado.monto;
        this.gastos = this.gastos.filter(gasto => gasto.id !== id);
    }

    editarGasto(gastoActualizado) {
        const index = this.gastos.findIndex(g => g.id === gastoActualizado.id);
        const diferencia = this.gastos[index].monto - gastoActualizado.monto;
        this.gastos[index] = gastoActualizado;
        this.restante += diferencia;
    }

    calcularTotalGastado() {
        return this.gastos.reduce((total, gasto) => total + gasto.monto, 0);
    }
}

class UI {
    mostrarPresupuesto(presupuesto) {
        document.getElementById('total-presupuesto').textContent = this.formatearMoneda(presupuesto.presupuesto);
        document.getElementById('restante-presupuesto').textContent = this.formatearMoneda(presupuesto.restante);
        document.getElementById('total-gastado').textContent = this.formatearMoneda(presupuesto.calcularTotalGastado());
        
        // Actualizar barra de progreso
        const porcentajeUsado = ((presupuesto.presupuesto - presupuesto.restante) / presupuesto.presupuesto) * 100;
        const barraProgreso = document.getElementById('barra-progreso');
        barraProgreso.style.width = `${porcentajeUsado}%`;
        
        // Cambiar color según el porcentaje usado
        if (porcentajeUsado > 80) {
            barraProgreso.classList.remove('bg-warning');
            barraProgreso.classList.add('bg-danger');
        } else if (porcentajeUsado > 50) {
            barraProgreso.classList.remove('bg-success', 'bg-danger');
            barraProgreso.classList.add('bg-warning');
        } else {
            barraProgreso.classList.remove('bg-warning', 'bg-danger');
            barraProgreso.classList.add('bg-success');
        }
    }

    mostrarGastos(gastos, filtro = '', categoria = '') {
        const listaGastos = document.getElementById('lista-gastos');
        listaGastos.innerHTML = '';

        let gastosFiltrados = gastos;
        
        if (filtro) {
            gastosFiltrados = gastosFiltrados.filter(gasto => 
                gasto.nombre.toLowerCase().includes(filtro.toLowerCase())
            );
        }
        
        if (categoria) {
            gastosFiltrados = gastosFiltrados.filter(gasto => 
                gasto.categoria === categoria
            );
        }

        if (gastosFiltrados.length === 0) {
            listaGastos.innerHTML = '<div class="text-center py-3 text-muted">No hay gastos registrados</div>';
            return;
        }

        gastosFiltrados.forEach(gasto => {
            const elementoGasto = document.createElement('div');
            elementoGasto.className = 'list-group-item list-group-item-action d-flex justify-content-between align-items-center';
            elementoGasto.innerHTML = `
                <div>
                    <h6 class="mb-1">${gasto.nombre}</h6>
                    <small class="text-muted">${this.formatearFecha(gasto.fecha)} • ${this.formatearCategoria(gasto.categoria)}</small>
                </div>
                <div class="d-flex align-items-center">
                    <span class="badge bg-primary rounded-pill me-2">${this.formatearMoneda(gasto.monto)}</span>
                    <button class="btn btn-sm btn-outline-secondary btn-editar me-1" data-id="${gasto.id}">
                        <i class="bi bi-pencil"> 🔧 </i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger btn-eliminar" data-id="${gasto.id}">
                        <i class="bi bi-trash"> ❌ </i>
                    </button>
                </div>
            `;
            listaGastos.appendChild(elementoGasto);

            // Evento para eliminar
            elementoGasto.querySelector('.btn-eliminar').addEventListener('click', () => {
                this.eliminarGasto(gasto.id);
            });

            // Evento para editar
            elementoGasto.querySelector('.btn-editar').addEventListener('click', () => {
                this.mostrarModalEditar(gasto.id);
            });
        });
    }
    eliminarGasto(id) {
        if (!confirm('¿Estás seguro de que quieres eliminar este gasto?')) return;
        
        try {
            presupuestoApp.eliminarGasto(id);
            this.mostrarPresupuesto(presupuestoApp);
            this.mostrarGastos(presupuestoApp.gastos);
            this.actualizarGraficos(presupuestoApp.gastos);
            guardarDatos();
            this.mostrarMensaje('Gasto eliminado correctamente', 'success');
        } catch (error) {
            console.error('Error al eliminar gasto:', error);
            this.mostrarMensaje('Error al eliminar el gasto', 'danger');
        }
    }

    mostrarModalEditar(id) {
        const gasto = presupuestoApp.gastos.find(g => g.id === id);
        if (!gasto) return;

        document.getElementById('editar-id').value = gasto.id;
        document.getElementById('editar-nombre').value = gasto.nombre;
        document.getElementById('editar-monto').value = gasto.monto;
        document.getElementById('editar-categoria').value = gasto.categoria;
        document.getElementById('editar-fecha').value = gasto.fecha;

        const modal = new bootstrap.Modal(document.getElementById('modal-editar-gasto'));
        modal.show();
    }

    actualizarGraficos(gastos) {
        // Gráfico de categorías
        const categorias = ['comida', 'transporte', 'vivienda', 'entretenimiento', 'salud', 'otros'];
        const datosCategorias = categorias.map(cat => {
            return gastos.filter(g => g.categoria === cat).reduce((sum, g) => sum + g.monto, 0);
        });

        if (this.graficoCategorias) {
            this.graficoCategorias.data.datasets[0].data = datosCategorias;
            this.graficoCategorias.update();
        } else {
            const ctxCategorias = document.getElementById('grafico-categorias').getContext('2d');
            this.graficoCategorias = new Chart(ctxCategorias, {
                type: 'pie',
                data: {
                    labels: categorias.map(c => this.formatearCategoria(c)),
                    datasets: [{
                        data: datosCategorias,
                        backgroundColor: [
                            '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'
                        ]
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'bottom',
                        }
                    }
                }
            });
        }

        // Gráfico de tendencia (últimos 7 días)
        const hoy = new Date();
        const ultimos7Dias = Array.from({ length: 7 }, (_, i) => {
            const fecha = new Date(hoy);
            fecha.setDate(hoy.getDate() - (6 - i));
            return fecha.toISOString().split('T')[0];
        });

        const datosTendencia = ultimos7Dias.map(fecha => {
            return gastos.filter(g => g.fecha === fecha).reduce((sum, g) => sum + g.monto, 0);
        });

        if (this.graficoTendencia) {
            this.graficoTendencia.data.labels = ultimos7Dias.map(f => f.split('-').reverse().join('/'));
            this.graficoTendencia.data.datasets[0].data = datosTendencia;
            this.graficoTendencia.update();
        } else {
            const ctxTendencia = document.getElementById('grafico-tendencia').getContext('2d');
            this.graficoTendencia = new Chart(ctxTendencia, {
                type: 'bar',
                data: {
                    labels: ultimos7Dias.map(f => f.split('-').reverse().join('/')),
                    datasets: [{
                        label: 'Gastos por día',
                        data: datosTendencia,
                        backgroundColor: '#36A2EB'
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
        }
    }

    mostrarMensaje(mensaje, tipo) {
        const div = document.createElement('div');
        div.className = `alert alert-${tipo} alert-dismissible fade show text-center`;
        div.innerHTML = `
            ${mensaje}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;
        
        document.querySelector('.contenido-principal').prepend(div);
        
        setTimeout(() => {
            div.remove();
        }, 5000);
    }

    formatearMoneda(valor) {
        return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(valor);
    }

    formatearFecha(fechaStr) {
        const fecha = new Date(fechaStr);
        return fecha.toLocaleDateString('es-AR');
    }

    formatearCategoria(categoria) {
        const categorias = {
            comida: 'Comida',
            transporte: 'Transporte',
            vivienda: 'Vivienda',
            entretenimiento: 'Entretenimiento',
            salud: 'Salud',
            otros: 'Otros'
        };
        return categorias[categoria] || categoria;
    }
}

// Aplicación principal
const ui = new UI();
let presupuestoApp;

// Eventos
document.addEventListener('DOMContentLoaded', () => {
    // Inicializar fecha actual en el formulario
    document.getElementById('fecha-gasto').valueAsDate = new Date();

    // Cargar datos guardados
    cargarDatos();

    // Configurar eventos
    document.getElementById('formulario-presupuesto').addEventListener('submit', establecerPresupuesto);
    document.getElementById('formulario-gasto').addEventListener('submit', agregarGasto);
    document.getElementById('filtro-busqueda').addEventListener('input', filtrarGastos);
    document.getElementById('filtro-categoria').addEventListener('change', filtrarGastos);
    document.getElementById('btn-guardar-cambios').addEventListener('click', editarGasto);
    document.getElementById('reiniciar-app').addEventListener('click', reiniciarAplicacion);
    document.getElementById('exportar-datos').addEventListener('click', exportarDatos);
});


function establecerPresupuesto(e) {
    e.preventDefault();
    const inputPresupuesto = document.getElementById('input-presupuesto');
    let valor = inputPresupuesto.value.trim();
    
    // Limpiar y convertir el valor
    valor = valor.replace(/\./g, '').replace(',', '.');
    const presupuesto = Number(valor);

    if (presupuesto <= 0 || isNaN(presupuesto)) {
        ui.mostrarMensaje('El presupuesto debe ser un número mayor a cero', 'danger');
        return;
    }

    // Formatear bonito para mostrar
    inputPresupuesto.value = presupuesto.toLocaleString('es-AR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });

    presupuestoApp = new Presupuesto(presupuesto);
    ui.mostrarPresupuesto(presupuestoApp);
    guardarDatos();
    document.getElementById('seccion-presupuesto').classList.add('d-none');
    ui.mostrarMensaje('Presupuesto establecido correctamente', 'success');
}

function agregarGasto(e) {
    e.preventDefault();
    if (!presupuestoApp) {
        ui.mostrarMensaje('Primero debes establecer un presupuesto', 'danger');
        return;
    }

    const nombre = document.getElementById('nombre-gasto').value.trim();
    const monto = Number(document.getElementById('monto-gasto').value);
    const categoria = document.getElementById('categoria-gasto').value;
    const fecha = document.getElementById('fecha-gasto').value;

    if (!nombre || !monto || !categoria || !fecha) {
        ui.mostrarMensaje('Todos los campos son obligatorios', 'danger');
        return;
    }

    if (monto <= 0) {
        ui.mostrarMensaje('El monto debe ser mayor a cero', 'danger');
        return;
    }

    if (monto > presupuestoApp.restante) {
        ui.mostrarMensaje('El gasto supera tu presupuesto disponible', 'danger');
        return;
    }

    const nuevoGasto = {
        id: Date.now().toString(),
        nombre,
        monto,
        categoria,
        fecha
    };

    presupuestoApp.agregarGasto(nuevoGasto);
    ui.mostrarPresupuesto(presupuestoApp);
    ui.mostrarGastos(presupuestoApp.gastos);
    ui.actualizarGraficos(presupuestoApp.gastos);
    guardarDatos();
    e.target.reset();
    document.getElementById('fecha-gasto').valueAsDate = new Date();
    ui.mostrarMensaje('Gasto agregado correctamente', 'success');
}

function editarGasto() {
    const id = document.getElementById('editar-id').value;
    const nombre = document.getElementById('editar-nombre').value.trim();
    const monto = Number(document.getElementById('editar-monto').value);
    const categoria = document.getElementById('editar-categoria').value;
    const fecha = document.getElementById('editar-fecha').value;

    if (!nombre || !monto || !categoria || !fecha) {
        ui.mostrarMensaje('Todos los campos son obligatorios', 'danger');
        return;
    }

    if (monto <= 0) {
        ui.mostrarMensaje('El monto debe ser mayor a cero', 'danger');
        return;
    }

    const gastoActualizado = { id, nombre, monto, categoria, fecha };
    presupuestoApp.editarGasto(gastoActualizado);
    
    ui.mostrarPresupuesto(presupuestoApp);
    ui.mostrarGastos(presupuestoApp.gastos);
    ui.actualizarGraficos(presupuestoApp.gastos);
    guardarDatos();
    
    bootstrap.Modal.getInstance(document.getElementById('modal-editar-gasto')).hide();
    ui.mostrarMensaje('Gasto actualizado correctamente', 'success');
}


function filtrarGastos() {
    const texto = document.getElementById('filtro-busqueda').value;
    const categoria = document.getElementById('filtro-categoria').value;
    ui.mostrarGastos(presupuestoApp.gastos, texto, categoria);
}

// Almacenamiento local
function guardarDatos() {
    if (!presupuestoApp) return;
    
    localStorage.setItem('presupuesto', JSON.stringify({
        presupuesto: presupuestoApp.presupuesto,
        restante: presupuestoApp.restante,
        gastos: presupuestoApp.gastos
    }));
}

function cargarDatos() {
    const datos = JSON.parse(localStorage.getItem('presupuesto'));
    if (!datos) return;

    presupuestoApp = new Presupuesto(datos.presupuesto);
    presupuestoApp.restante = datos.restante;
    presupuestoApp.gastos = datos.gastos || [];

    ui.mostrarPresupuesto(presupuestoApp);
    ui.mostrarGastos(presupuestoApp.gastos);
    ui.actualizarGraficos(presupuestoApp.gastos);
    
    // Ocultar sección de presupuesto si ya hay uno establecido
    document.getElementById('seccion-presupuesto').classList.add('d-none');
}

function reiniciarAplicacion() {
    if (!confirm('¿Estás seguro de que quieres reiniciar la aplicación? Se perderán todos los datos.')) return;
    
    localStorage.removeItem('presupuesto');
    location.reload();
}
function exportarDatos() {
    if (!presupuestoApp || presupuestoApp.gastos.length === 0) {
        ui.mostrarMensaje('No hay datos para exportar', 'warning');
        return;
    }

    // Crear encabezados CSV
    let csv = 'Fecha;Nombre;Categoría;Monto\n';
    
    // Agregar cada gasto como una línea en el CSV
    presupuestoApp.gastos.forEach(gasto => {
        csv += `"${gasto.fecha}";"${gasto.nombre}";"${ui.formatearCategoria(gasto.categoria)}"; $ ${gasto.monto}\n`;
    });
    
    // Agregar resumen al final
    csv += `\n\nResumen\n`;
    csv += `Presupuesto inicial; $ ${presupuestoApp.presupuesto}\n`;
    csv += `Total gastado:; $ ${presupuestoApp.calcularTotalGastado()}\n`;
    csv += `Saldo restante; $ ${presupuestoApp.restante}\n`;

    // Crear el archivo CSV
    const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gastos-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    ui.mostrarMensaje('Datos exportados a CSV correctamente', 'success');
}
