// package com.glpi.glpi_spring.config;

// import org.hibernate.dialect.Dialect;
// import org.hibernate.dialect.identity.IdentityColumnSupportImpl;
// import org.hibernate.dialect.identity.IdentityColumnSupport;

// public class SQLiteDialect extends Dialect {
//     @Override
//     public IdentityColumnSupport getIdentityColumnSupport() {
//         return new IdentityColumnSupportImpl();
//     }

//     @Override
//     public boolean supportsIdentityColumns() {
//         return true;
//     }

//     @Override
//     public boolean hasDataTypeInIdentityColumn() {
//         return false;
//     }

//     @Override
//     public String getIdentityColumnString() {
//         return "integer";
//     }

//     @Override
//     public String getIdentitySelectString(String table, String column, int type) {
//         return "select last_insert_rowid()";
//     }
// }
