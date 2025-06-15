// Modello Sequelize per Marker
module.exports = (sequelize, DataTypes) => {
    const Marker = sequelize.define('Marker', {
      longitude: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
      latitude: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'users', // Nome della tabella utenti
          key: 'id',
        },
      },
    });
    Marker.associate = function(models) {
      Marker.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    };
    return Marker;
  };
  