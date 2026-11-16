using System.Data;
using System.Data.SqlClient;

namespace backend.HelperClasses;

public class DBAccess
{
    private readonly string _connectionString;

    public DBAccess(IConfiguration configuration)
    {
        var connStr = configuration.GetConnectionString("DefaultConnection");
        if (string.IsNullOrWhiteSpace(connStr))
        {
            throw new InvalidOperationException("Database connection string 'DefaultConnection' is not configured.");
        }
        _connectionString = connStr;
    }

    public DataTable GetData(string storedProcName, SqlParameter[]? parameters = null)
    {
        using var con = new SqlConnection(_connectionString);
        using var cmd = new SqlCommand(storedProcName, con);
        cmd.CommandType = CommandType.StoredProcedure;
        cmd.CommandTimeout = 120;

        if (parameters != null)
            cmd.Parameters.AddRange(parameters);

        var resultTable = new DataTable();
        con.Open();

        using var reader = cmd.ExecuteReader();
        resultTable.Load(reader);

        while (!reader.IsClosed && reader.NextResult())
            while (reader.Read()) { /* consume */ }

        return resultTable;
    }

    public DataTable GetDataByQuery(string query, SqlParameter[]? parameters = null)
    {
        using var con = new SqlConnection(_connectionString);
        using var cmd = new SqlCommand(query, con);
        cmd.CommandType = CommandType.Text;
        cmd.CommandTimeout = 120;

        if (parameters != null)
            cmd.Parameters.AddRange(parameters);

        var resultTable = new DataTable();
        con.Open();

        using var reader = cmd.ExecuteReader();
        resultTable.Load(reader);

        return resultTable;
    }

    public async Task<DataTable> GetDataAsync(string storedProcName, SqlParameter[]? parameters = null)
    {
        await using var con = new SqlConnection(_connectionString);
        await using var cmd = new SqlCommand(storedProcName, con);
        cmd.CommandType = CommandType.StoredProcedure;
        cmd.CommandTimeout = 120;

        if (parameters != null)
            cmd.Parameters.AddRange(parameters);

        var resultTable = new DataTable();
        await con.OpenAsync();

        await using var reader = await cmd.ExecuteReaderAsync();
        resultTable.Load(reader);

        return resultTable;
    }

    public void ExecuteCommand(string storedProcName, SqlParameter[] parameters)
    {
        using var connection = new SqlConnection(_connectionString);
        using var command = new SqlCommand(storedProcName, connection);
        command.CommandType = CommandType.StoredProcedure;
        command.CommandTimeout = 120;
        command.Parameters.AddRange(parameters);
        connection.Open();
        command.ExecuteNonQuery();
    }

    public async Task ExecuteCommandAsync(string storedProcName, SqlParameter[] parameters)
    {
        await using var connection = new SqlConnection(_connectionString);
        await using var command = new SqlCommand(storedProcName, connection);
        command.CommandType = CommandType.StoredProcedure;
        command.CommandTimeout = 120;
        command.Parameters.AddRange(parameters);
        await connection.OpenAsync();
        await command.ExecuteNonQueryAsync();
    }

    public DataSet GetDataSet(string storedProcName, SqlParameter[]? parameters = null)
    {
        using var con = new SqlConnection(_connectionString);
        using var cmd = new SqlCommand(storedProcName, con);
        cmd.CommandType = CommandType.StoredProcedure;
        cmd.CommandTimeout = 120;

        if (parameters != null)
            cmd.Parameters.AddRange(parameters);

        using var da = new SqlDataAdapter(cmd);
        var ds = new DataSet();
        da.Fill(ds);
        return ds;
    }

    public async Task<DataSet> GetDataSetAsync(string storedProcName, SqlParameter[]? parameters = null)
    {
        return await Task.Run(() => GetDataSet(storedProcName, parameters));
    }
}
