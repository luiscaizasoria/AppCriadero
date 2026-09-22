export const DATABASE_VERSION_V5 = 5;


export const migrationV5 = `

ALTER TABLE ave_evolucion
ADD COLUMN peso_gramos REAL;


ALTER TABLE ave_evolucion
ADD COLUMN altura_cm REAL;


ALTER TABLE ave_evolucion
ADD COLUMN largo_cm REAL;


ALTER TABLE bajas_ave
ADD COLUMN celular TEXT;


ALTER TABLE bajas_ave
ADD COLUMN valor_envio REAL;


CREATE INDEX IF NOT EXISTS
idx_bajas_ave_celular
ON bajas_ave(celular);

`;
